from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import os
import httpx
from datetime import datetime

router = APIRouter()

@router.get("/news", response_model=List[Dict[str, Any]])
async def fetch_aplv_news():
    """Fetch APLV-related news from NewsAPI and return up to 10 latest articles.

    The API key is read from the NEWS_API_KEY environment variable on the
    server side. This endpoint can be called directly from the frontend without
    exposing the key to clients.
    """
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="NEWS_API_KEY not configured")

    queries = [
        {"q": "alergia leite bebê", "language": "pt"},
        {"q": "milk protein allergy baby", "language": "en"},
        {"q": "APLV bébé lait", "language": "fr"},
    ]

    articles: List[Dict[str, Any]] = []
    seen = set()

    async with httpx.AsyncClient() as client:
        for q in queries:
            params = {
                "q": q["q"],
                "language": q["language"],
                "sortBy": "publishedAt",
                "pageSize": 5,
                "apiKey": api_key,
            }
            resp = await client.get("https://newsapi.org/v2/everything", params=params)
            if resp.status_code != 200:
              print(resp.text)
            data = resp.json()
            for a in data.get("articles", []):
                url = a.get("url")
                title = a.get("title", "")
                if url and url not in seen and "[Removed]" not in title:
                    seen.add(url)
                    articles.append({
                        "title": title,
                        "description": a.get("description"),
                        "url": url,
                        "publishedAt": a.get("publishedAt"),
                        "source": a.get("source", {}).get("name", ""),
                    })

    articles.sort(
        key=lambda a: datetime.fromisoformat(
            a["publishedAt"].replace("Z", "+00:00")
        ) if a.get("publishedAt") else datetime.min,
        reverse=True,
    )
    return articles[:10]
