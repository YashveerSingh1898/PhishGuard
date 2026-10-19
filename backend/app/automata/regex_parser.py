"""Regular Expression Parser for Models of Computation (MOC).

Provides lexical tokenization, AST generation, and syntax validation for a clearly
defined subset of regular expressions:
- Literals: Alphanumeric characters and symbols (supports '\\' escapes)
- Concatenation: Implicit (e.g., 'ab', 'a(b|c)')
- Alternation: '|'
- Kleene Star: '*' (zero or more)
- One-or-More: '+' (one or more)
- Optional: '?' (zero or one)
- Grouping: '(' and ')'

Operator precedence:
1. Grouping: ( ... )
2. Postfix repetition: *, +, ?
3. Concatenation (implicit)
4. Alternation: |
"""

from dataclasses import dataclass
from typing import List, Optional, Union


class RegexSyntaxError(ValueError):
    """Raised when a regular expression violates grammatical syntax."""

    def __init__(self, message: str, position: Optional[int] = None):
        self.position = position
        if position is not None:
            full_msg = f"{message} (at index {position})"
        else:
            full_msg = message
        super().__init__(full_msg)


# --- Abstract Syntax Tree (AST) Nodes ---


class RegexNode:
    """Base class for all Regex AST nodes."""
    pass


@dataclass
class LiteralNode(RegexNode):
    """Represents a single literal symbol from the alphabet."""
    char: str


@dataclass
class ConcatNode(RegexNode):
    """Represents concatenation of left and right expressions."""
    left: RegexNode
    right: RegexNode


@dataclass
class UnionNode(RegexNode):
    """Represents alternation of left and right expressions (left | right)."""
    left: RegexNode
    right: RegexNode


@dataclass
class StarNode(RegexNode):
    """Represents Kleene star repetition (child*)."""
    child: RegexNode


@dataclass
class PlusNode(RegexNode):
    """Represents one-or-more repetition (child+)."""
    child: RegexNode


@dataclass
class OptionalNode(RegexNode):
    """Represents zero-or-one repetition (child?)."""
    child: RegexNode


# --- Lexer / Tokenizer ---


@dataclass
class Token:
    type: str  # 'LITERAL', 'UNION', 'STAR', 'PLUS', 'OPTIONAL', 'LPAREN', 'RPAREN', 'EOF'
    value: str
    position: int


def tokenize(pattern: str) -> List[Token]:
    """Converts a regex string into a sequence of strongly-typed tokens.
    
    Handles character escapes, validates structure, and captures character positions.
    """
    if not pattern:
        raise RegexSyntaxError("Regular expression pattern cannot be empty.")

    tokens: List[Token] = []
    i = 0
    n = len(pattern)

    while i < n:
        char = pattern[i]
        pos = i

        if char == '\\':
            if i + 1 >= n:
                raise RegexSyntaxError("Dangling escape character '\\' at end of pattern.", pos)
            escaped_char = pattern[i + 1]
            tokens.append(Token('LITERAL', escaped_char, pos))
            i += 2
        elif char == '|':
            tokens.append(Token('UNION', '|', pos))
            i += 1
        elif char == '*':
            tokens.append(Token('STAR', '*', pos))
            i += 1
        elif char == '+':
            tokens.append(Token('PLUS', '+', pos))
            i += 1
        elif char == '?':
            tokens.append(Token('OPTIONAL', '?', pos))
            i += 1
        elif char == '(':
            tokens.append(Token('LPAREN', '(', pos))
            i += 1
        elif char == ')':
            tokens.append(Token('RPAREN', ')', pos))
            i += 1
        else:
            tokens.append(Token('LITERAL', char, pos))
            i += 1

    tokens.append(Token('EOF', '', n))
    return tokens


# --- Recursive Descent Parser ---


class RegexParser:
    """Recursive descent parser translating tokens into a verified Regex AST.
    
    Grammar:
        expression -> concatenation ('|' concatenation)*
        concatenation -> repetition+
        repetition -> primary ('*' | '+' | '?')*
        primary -> LITERAL | '(' expression ')'
    """

    def __init__(self, pattern: str):
        self.pattern = pattern
        self.tokens = tokenize(pattern)
        self.pos = 0
        self.paren_stack: List[Token] = []

    def current_token(self) -> Token:
        return self.tokens[self.pos]

    def consume(self, expected_type: Optional[str] = None) -> Token:
        tok = self.current_token()
        if expected_type and tok.type != expected_type:
            raise RegexSyntaxError(
                f"Expected token {expected_type} but found {tok.type} ('{tok.value}')",
                tok.position
            )
        self.pos += 1
        return tok

    def parse(self) -> RegexNode:
        """Parses the entire token stream and ensures EOF is reached."""
        if self.current_token().type == 'EOF':
            raise RegexSyntaxError("Empty regular expression.")

        ast = self.parse_expression()
        if self.current_token().type != 'EOF':
            tok = self.current_token()
            if tok.type == 'RPAREN':
                raise RegexSyntaxError("Unmatched closing parenthesis ')'", tok.position)
            raise RegexSyntaxError(f"Unexpected token '{tok.value}' at end of pattern", tok.position)
        return ast

    def parse_expression(self) -> RegexNode:
        """Parses alternation: concat ('|' concat)*"""
        # Leading '|' error check
        if self.current_token().type == 'UNION':
            raise RegexSyntaxError("Alternation operator '|' missing left operand", self.current_token().position)

        node = self.parse_concatenation()

        while self.current_token().type == 'UNION':
            union_tok = self.consume('UNION')
            # Check for trailing '|' or consecutive '||'
            if self.current_token().type in ('EOF', 'RPAREN'):
                raise RegexSyntaxError("Alternation operator '|' missing right operand", union_tok.position)
            if self.current_token().type == 'UNION':
                raise RegexSyntaxError("Empty branch in alternation '||'", self.current_token().position)
            
            right = self.parse_concatenation()
            node = UnionNode(left=node, right=right)

        return node

    def parse_concatenation(self) -> RegexNode:
        """Parses concatenation: repetition+"""
        factors: List[RegexNode] = []

        while self._can_start_primary():
            factors.append(self.parse_repetition())

        if not factors:
            tok = self.current_token()
            if tok.type in ('STAR', 'PLUS', 'OPTIONAL'):
                raise RegexSyntaxError(
                    f"Repetition operator '{tok.value}' has no preceding operand",
                    tok.position
                )
            if tok.type == 'EOF' and self.paren_stack:
                unmatched = self.paren_stack[-1]
                raise RegexSyntaxError("Unmatched opening parenthesis '('", unmatched.position)
            raise RegexSyntaxError(f"Expected expression but found '{tok.value}'", tok.position)

        # Fold factors left-to-right into ConcatNodes
        node = factors[0]
        for factor in factors[1:]:
            node = ConcatNode(left=node, right=factor)
        return node

    def parse_repetition(self) -> RegexNode:
        """Parses primary followed by zero or more *, +, ? operators."""
        node = self.parse_primary()

        while self.current_token().type in ('STAR', 'PLUS', 'OPTIONAL'):
            op_tok = self.consume()
            if op_tok.type == 'STAR':
                node = StarNode(child=node)
            elif op_tok.type == 'PLUS':
                node = PlusNode(child=node)
            elif op_tok.type == 'OPTIONAL':
                node = OptionalNode(child=node)

        return node

    def parse_primary(self) -> RegexNode:
        """Parses literals or grouped parenthetical expressions."""
        tok = self.current_token()

        if tok.type == 'LITERAL':
            self.consume('LITERAL')
            return LiteralNode(char=tok.value)

        elif tok.type == 'LPAREN':
            lparen_tok = self.consume('LPAREN')
            self.paren_stack.append(lparen_tok)
            if self.current_token().type == 'RPAREN':
                raise RegexSyntaxError("Empty parentheses '()' are not permitted", lparen_tok.position)
            
            sub_expr = self.parse_expression()

            if self.current_token().type != 'RPAREN':
                raise RegexSyntaxError("Unmatched opening parenthesis '('", lparen_tok.position)
            self.consume('RPAREN')
            self.paren_stack.pop()
            return sub_expr

        elif tok.type in ('STAR', 'PLUS', 'OPTIONAL'):
            raise RegexSyntaxError(
                f"Repetition operator '{tok.value}' has no preceding operand",
                tok.position
            )

        elif tok.type == 'RPAREN':
            raise RegexSyntaxError("Unmatched closing parenthesis ')'", tok.position)

        elif tok.type == 'EOF':
            raise RegexSyntaxError("Unexpected end of pattern", tok.position)

        raise RegexSyntaxError(f"Unexpected token '{tok.value}'", tok.position)

    def _can_start_primary(self) -> bool:
        """Checks if the current token can begin a primary expression."""
        return self.current_token().type in ('LITERAL', 'LPAREN')


def parse_regex(pattern: str) -> RegexNode:
    """Convenience entry point to parse a regular expression pattern into an AST."""
    parser = RegexParser(pattern)
    return parser.parse()
