from fastapi import FastAPI, Request
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Define the expected request body
class Data(BaseModel):
    name: str
    age: int

@app.post("/ReceiveData")
async def receive_data(data: Data):
    return {
        "message": f"Hello {data.name}, you are {data.age} years old!"
    }

# For local testing
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)