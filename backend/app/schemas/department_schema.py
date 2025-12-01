from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    office: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=50)

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    office: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=50)

class Department(DepartmentBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)