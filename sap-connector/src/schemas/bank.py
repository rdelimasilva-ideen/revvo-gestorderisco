from pydantic import BaseModel


class BankRequest(BaseModel):
    vendor: str


class BankResponse(BaseModel):
    bank_name: str
    account_number: str
    account_digit: str
