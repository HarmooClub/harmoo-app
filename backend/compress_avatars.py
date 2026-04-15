"""Compress all avatars in MongoDB Atlas to reduce document size"""
import asyncio
import base64
import io
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image

ATLAS_URL = 'mongodb+srv://Harmoo:disSvjaK5fdDOWVG@cluster0.nbrmuvx.mongodb.net/?retryWrites=true&w=majority'
MAX_SIZE = 400  # max width/height in pixels
JPEG_QUALITY = 70  # JPEG quality (1-100)

async def compress_avatars():
    client = AsyncIOMotorClient(ATLAS_URL, serverSelectionTimeoutMS=30000)
    db = client['test_database']
    
    users = await db.users.find(
        {"avatar": {"$exists": True, "$regex": "^data:image"}},
        {"id": 1, "full_name": 1, "avatar": 1, "_id": 0}
    ).to_list(100)
    
    print(f"Found {len(users)} users with avatars")
    
    for u in users:
        uid = u['id']
        name = u.get('full_name', '?')
        avatar = u.get('avatar', '')
        
        if not avatar.startswith('data:image'):
            continue
            
        original_size = len(avatar)
        
        try:
            # Decode base64
            header, b64data = avatar.split(",", 1)
            image_bytes = base64.b64decode(b64data)
            
            # Open with PIL
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB (JPEG doesn't support alpha)
            if img.mode in ('RGBA', 'P', 'LA'):
                img = img.convert('RGB')
            
            # Resize if larger than MAX_SIZE
            w, h = img.size
            if w > MAX_SIZE or h > MAX_SIZE:
                ratio = min(MAX_SIZE / w, MAX_SIZE / h)
                new_size = (int(w * ratio), int(h * ratio))
                img = img.resize(new_size, Image.LANCZOS)
            
            # Compress to JPEG
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=JPEG_QUALITY, optimize=True)
            compressed_bytes = buffer.getvalue()
            
            # Encode back to base64
            new_avatar = f"data:image/jpeg;base64,{base64.b64encode(compressed_bytes).decode()}"
            new_size = len(new_avatar)
            
            # Update in DB
            await db.users.update_one(
                {"id": uid},
                {"$set": {"avatar": new_avatar}}
            )
            
            reduction = (1 - new_size / original_size) * 100
            print(f"  {name}: {original_size//1024}KB -> {new_size//1024}KB ({reduction:.0f}% reduction)")
            
        except Exception as e:
            print(f"  {name}: ERROR - {e}")
    
    client.close()
    print("\nDone!")

asyncio.run(compress_avatars())
