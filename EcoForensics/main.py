from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import uvicorn
from ai_core import EcoForensicsEngine

app = FastAPI()
engine = EcoForensicsEngine()

# Setup Static (CSS/JS) & Templates (HTML)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

class LocationReq(BaseModel):
    lat: float
    lon: float

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/predict")
async def get_prediction(req: LocationReq):
    # Panggil Logic 3 Hari dari AI Core
    forecast = engine.get_forecast_logic(req.lat, req.lon)
    return {"status": "success", "data": forecast}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)