import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime

load_dotenv(Path(__file__).parent / '.env', override=True)
mongo_url = os.environ.get('MONGO_URL')

async def apply_badges():
    client = AsyncIOMotorClient(mongo_url)
    db = client['harmoo_db']
    
    names = ['Flavie', 'Fournier']
    for name in names:
        users = await db.users.find({"full_name": {"$regex": name, "$options": "i"}}).to_list(10)
        print(f'Recherche "{name}": {len(users)} résultat(s)')
        for u in users:
            print(f'  - {u["full_name"]} ({u["email"]}) | is_harmoo_club: {u.get("is_harmoo_club", False)}')
            result = await db.users.update_one(
                {"id": u["id"]},
                {"$set": {"is_harmoo_club": True, "club_joined_at": datetime.utcnow()}}
            )
            print(f'    -> Badge appliqué! (modified: {result.modified_count})')
    
    client.close()

asyncio.run(apply_badges())
