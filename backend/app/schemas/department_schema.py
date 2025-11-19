from pydantic import BaseModel


class DepartmentBase(BaseModel):
    name: str


class DepartmentCreate(DepartmentBase):
    """Схема для создания отдела."""
    pass


class Department(DepartmentBase):
    """Схема, которую возвращаем из API."""
    id: int

    class Config:
        from_attributes = True
