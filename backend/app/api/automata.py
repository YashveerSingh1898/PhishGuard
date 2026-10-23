"""API router for Automata Theory operations."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from app.automata.regex_parser import RegexSyntaxError, parse_regex
from app.automata.nfa import ThompsonBuilder
from app.automata.dfa import nfa_to_dfa
from app.automata.minimizer import minimize_dfa
from app.automata.service import convert_regex_pipeline

router = APIRouter(prefix="/automata", tags=["Automata Engine"])


class RegexConvertRequest(BaseModel):
    regex: str = Field(..., description="Regular expression pattern to compile and convert", min_length=1)
    input_string: Optional[str] = Field(None, description="Optional input string to simulate on the constructed automaton")

    model_config = {
        "json_schema_extra": {
            "example": {
                "regex": "a(b|c)*",
                "input_string": "abc"
            }
        }
    }


class AutomataSimulateRequest(BaseModel):
    regex: str = Field(..., description="Regular expression pattern to compile", min_length=1)
    input_string: str = Field("", description="Input string to simulate on the constructed Minimized DFA")

    model_config = {
        "json_schema_extra": {
            "example": {
                "regex": "(a|b)*abb",
                "input_string": "ababb"
            }
        }
    }


@router.post("/convert", summary="Convert Regex to Thompson NFA, Subset DFA, and Minimized DFA")
async def convert_automata(request: RegexConvertRequest) -> Dict[str, Any]:
    """Compiles a regular expression through the three formal conversion stages:
    
    1. Regular Expression -> Thompson's NFA (with epsilon transitions)
    2. NFA -> DFA using Subset Construction (powerset algorithm)
    3. DFA -> Minimized DFA using Partition Refinement (Hopcroft / Moore)
    
    Returns complete transition tables, states, and educational conversion traces.
    Optionally returns step-by-step string simulation if input_string is provided.
    """
    try:
        result = convert_regex_pipeline(request.regex, input_string=request.input_string)
        return result
    except RegexSyntaxError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": "RegexSyntaxError",
                "message": str(e),
                "position": e.position,
                "pattern": request.regex,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "InternalAutomataError",
                "message": f"Conversion error: {str(e)}",
            }
        )


@router.post("/simulate", summary="Simulate an input string on the Minimized DFA of a regular expression")
async def simulate_automata(request: AutomataSimulateRequest) -> Dict[str, Any]:
    """Simulates an input string on the Minimized DFA constructed from the given regex."""
    try:
        ast = parse_regex(request.regex)
        nfa = ThompsonBuilder().build(ast)
        dfa = nfa_to_dfa(nfa)
        min_dfa = minimize_dfa(dfa)
        trace = min_dfa.simulate(request.input_string)
        return {
            "success": True,
            "regex": request.regex,
            "input_string": request.input_string,
            "trace": trace,
        }
    except RegexSyntaxError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": "RegexSyntaxError",
                "message": str(e),
                "position": e.position,
                "pattern": request.regex,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "InternalAutomataError",
                "message": f"Simulation error: {str(e)}",
            }
        )
