from pydantic import BaseModel


class EmployerBase(BaseModel):
    name: str
    department_id: int | None = None
    contact_email: str | None = None
    description: str | None = None


class EmployerCreate(EmployerBase):
    """Что нужно при создании работодателя."""
    pass


class Employer(EmployerBase):
    """Что возвращаем в API."""
    id: int

    class Config:
        from_attributes = True
