"""Unit tests for the Regex Parser (AST, Operator Precedence, and Error Handling)."""

import pytest
from app.automata.regex_parser import (
    parse_regex,
    RegexSyntaxError,
    LiteralNode,
    ConcatNode,
    UnionNode,
    StarNode,
    PlusNode,
    OptionalNode,
)


def test_literal_parsing():
    ast = parse_regex("a")
    assert isinstance(ast, LiteralNode)
    assert ast.char == "a"


def test_concatenation_parsing():
    ast = parse_regex("ab")
    assert isinstance(ast, ConcatNode)
    assert isinstance(ast.left, LiteralNode) and ast.left.char == "a"
    assert isinstance(ast.right, LiteralNode) and ast.right.char == "b"


def test_multi_concatenation_associativity():
    ast = parse_regex("abc")
    assert isinstance(ast, ConcatNode)
    assert isinstance(ast.left, ConcatNode)
    assert ast.left.left.char == "a"
    assert ast.left.right.char == "b"
    assert ast.right.char == "c"


def test_union_parsing():
    ast = parse_regex("a|b")
    assert isinstance(ast, UnionNode)
    assert isinstance(ast.left, LiteralNode) and ast.left.char == "a"
    assert isinstance(ast.right, LiteralNode) and ast.right.char == "b"


def test_star_operator():
    ast = parse_regex("a*")
    assert isinstance(ast, StarNode)
    assert isinstance(ast.child, LiteralNode) and ast.child.char == "a"


def test_plus_and_optional_operators():
    ast = parse_regex("a+")
    assert isinstance(ast, PlusNode)
    assert ast.child.char == "a"

    ast_opt = parse_regex("b?")
    assert isinstance(ast_opt, OptionalNode)
    assert ast_opt.child.char == "b"


def test_precedence_star_over_concat():
    # ab* should parse as a · (b*), not (ab)*
    ast = parse_regex("ab*")
    assert isinstance(ast, ConcatNode)
    assert isinstance(ast.left, LiteralNode) and ast.left.char == "a"
    assert isinstance(ast.right, StarNode)
    assert ast.right.child.char == "b"


def test_precedence_concat_over_union():
    # ab|cd should parse as (ab) | (cd)
    ast = parse_regex("ab|cd")
    assert isinstance(ast, UnionNode)
    assert isinstance(ast.left, ConcatNode)
    assert isinstance(ast.right, ConcatNode)


def test_parentheses_overrides_precedence():
    # (a|b)*c
    ast = parse_regex("(a|b)*c")
    assert isinstance(ast, ConcatNode)
    assert isinstance(ast.left, StarNode)
    assert isinstance(ast.left.child, UnionNode)
    assert isinstance(ast.right, LiteralNode) and ast.right.char == "c"


def test_character_escaping():
    # Escaping operators: \* should be literal '*', \. should be literal '.'
    ast = parse_regex(r"a\*b")
    assert isinstance(ast, ConcatNode)
    assert isinstance(ast.left, ConcatNode)
    assert ast.left.left.char == "a"
    assert ast.left.right.char == "*"
    assert ast.right.char == "b"


@pytest.mark.parametrize("invalid_pattern,expected_msg", [
    ("", "cannot be empty"),
    ("()", "Empty parentheses"),
    ("(a|)", "missing right operand"),
    ("|a", "missing left operand"),
    ("a||b", "Empty branch"),
    ("*a", "no preceding operand"),
    ("+a", "no preceding operand"),
    ("?a", "no preceding operand"),
    ("a(", "Unmatched opening parenthesis"),
    ("a)", "Unmatched closing parenthesis"),
    ("a\\", "Dangling escape"),
])
def test_syntax_errors_rejected(invalid_pattern, expected_msg):
    with pytest.raises(RegexSyntaxError) as exc_info:
        parse_regex(invalid_pattern)
    assert expected_msg.lower() in str(exc_info.value).lower()
