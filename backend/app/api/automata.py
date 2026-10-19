"""API router for Automata Theory operations."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.automata.regex_parser import RegexSyntaxError
from app.automata.service import convert_regex_pipeline

router = APIRouter(prefix="/automata", tags=["Automata Engine"])


class RegexConvertRequest(BaseModel):
    regex: str = Field(..., description="Regular expression pattern to compile and convert", min_length=1)

    model_config = {
        "json_schema_extra": {
            "example": {
                "regex": "a(b|c)*"
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
    """
    try:
        result = convert_regex_pipeline(request.regex)
        return result
    except RegexSyntaxError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": "RegexSyntaxError",
                "message": str(e),
                "position": e.position,
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
