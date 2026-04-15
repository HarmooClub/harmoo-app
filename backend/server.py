from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import base64
import math
import random
import string
# import resend  # Temporarily disabled for deployment

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'harmoo_db')]

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'harmoo-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Email Configuration (Temporarily disabled)
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'Harmoo <noreply@harmooclub.com>')
# if RESEND_API_KEY:
#     resend.api_key = RESEND_API_KEY

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Email sending helper (disabled)
async def send_email(to: str, subject: str, html: str):
    """Send email - temporarily disabled"""
    logger.info(f"[EMAIL DISABLED] To: {to}, Subject: {subject}")
    return True

def generate_verification_code():
    """Generate 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

# Create the main app
from fastapi.responses import FileResponse
import os as os_module

app = FastAPI(title="Harmoo Marketplace API")

# Health check route at root
@app.get("/")
def health():
    return {"status": "ok"}

# Temporary admin endpoint to delete all users
@app.delete("/admin/clear-users")
async def clear_all_users():
    result = await db.users.delete_many({})
    return {"deleted": result.deleted_count}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Download endpoint for ZIP file
@api_router.get("/download/harmoo-app.zip")
async def download_zip():
    zip_path = "/app/backend/harmoo-app.zip"
    if os_module.path.exists(zip_path):
        return FileResponse(zip_path, filename="harmoo-app.zip", media_type="application/zip")
    raise HTTPException(status_code=404, detail="File not found")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== AVATAR SERVING ENDPOINT ====================
import base64

@api_router.get("/avatar/{user_id}")
async def get_avatar(user_id: str):
    """Serve avatar image with aggressive caching"""
    from starlette.responses import Response
    user = await db.users.find_one({"id": user_id}, {"avatar": 1})
    if not user or not user.get("avatar"):
        raise HTTPException(status_code=404, detail="No avatar")
    
    avatar = user["avatar"]
    if avatar.startswith("data:image"):
        header, b64data = avatar.split(",", 1)
        mime_type = header.split(":")[1].split(";")[0]
        image_bytes = base64.b64decode(b64data)
        return Response(
            content=image_bytes,
            media_type=mime_type,
            headers={
                "Cache-Control": "public, max-age=86400, s-maxage=604800",
                "CDN-Cache-Control": "public, max-age=604800",
            }
        )
    from starlette.responses import RedirectResponse
    return RedirectResponse(url=avatar, status_code=302)

# ==================== CATEGORIES & SUBCATEGORIES ====================

CATEGORIES_DATA = {
    "music": {
        "name": "Musique",
        "icon": "musical-notes",
        "subcategories": [
            "beatmaker", "ingénieur du son", "DJ", "chanteur/rappeur", 
            "studio d'enregistrement", "auteur-compositeur", "label/producteur", "toplineur"
        ]
    },
    "video": {
        "name": "Audiovisuel",
        "icon": "videocam",
        "subcategories": [
            "réalisateur", "monteur", "société de production", "journaliste",
            "cadreur", "producteur", "créateur d'animations", "technicien"
        ]
    },
    "photo": {
        "name": "Photographie",
        "icon": "camera",
        "subcategories": ["photographe", "retoucheur photo", "modèle", "Make Up Artist"]
    },
    "design": {
        "name": "Arts graphiques",
        "icon": "color-palette",
        "subcategories": [
            "graphiste", "designer d'objet", "designer d'espace", "animateur 2D/3D",
            "artiste plasticien", "illustrateur", "éditeur"
        ]
    },
    "fashion": {
        "name": "Mode",
        "icon": "shirt",
        "subcategories": ["styliste", "modéliste", "couturier", "créateur de mode", "mannequin"]
    },
    "event": {
        "name": "Événementiel",
        "icon": "calendar",
        "subcategories": [
            "scénographe/metteur en scène", "organisateur d'événement", "animateur",
            "technicien son lumière", "responsable sécurité", "responsable sponsoring",
            "décorateur", "responsable logistique", "traiteur"
        ]
    },
    "architecture": {
        "name": "Architecture",
        "icon": "business",
        "subcategories": ["dessinateur", "architecte d'intérieur", "urbaniste", "paysagiste"]
    },
    "writing": {
        "name": "Rédaction",
        "icon": "document-text",
        "subcategories": ["scénariste", "correcteur", "éditeur", "auteur fantôme", "écrivain/auteur", "relecteur"]
    },
    "content": {
        "name": "Création de contenu",
        "icon": "megaphone",
        "subcategories": [
            "gestionnaire de communauté", "influenceur", "créateur de contenu", "rédacteur publicitaire",
            "vidéaste YouTube", "podcasteur", "blogueur", "gestionnaire de réseaux sociaux"
        ]
    },
    "artisanal": {
        "name": "Créations artisanales",
        "icon": "color-wand",
        "subcategories": [
            "bijoux artisanaux", "bougies artisanales", "peinture", "création de meubles",
            "maroquinerie", "céramique", "poterie", "sculpture", "broderie",
            "savonnerie artisanale", "travail du bois", "verrerie", "tapisserie", "artisan fleuriste"
        ]
    },
    "spectacle_vivant": {
        "name": "Spectacle vivant",
        "icon": "mic",
        "subcategories": [
            "danseur", "stand-uppeur", "comédien", "performance scénique",
            "humoriste", "metteur en scène", "circassien", "conteur"
        ]
    },
    "ia": {
        "name": "IA",
        "icon": "hardware-chip",
        "subcategories": [
            "Développeur IA", "Prompt Artist", "AI Designer", "Conversation Designer",
            "IA Music Producer", "AI Copywriter", "Directeur Artistique IA"
        ]
    }
}

# Service limits by subscription tier
SERVICE_LIMITS = {
    "essentiel": 1,  # Free tier
    "standard": 2,
    "business": 3
}

# ==================== MODELS ====================

class ServiceOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    description: Optional[str] = ""

class ServiceOptionCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = ""

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    user_type: str = "client"  # client or freelancer

class UserCreate(UserBase):
    password: str
    categories: List[str] = []
    subcategories: List[str] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    user_type: str
    bio: Optional[str] = ""
    avatar: Optional[str] = None
    location: Optional[Dict[str, float]] = None
    city: Optional[str] = ""
    categories: List[str] = []
    subcategories: List[str] = []
    hourly_rate: Optional[float] = None
    is_harmoo_club: bool = False
    subscription_tier: str = "essentiel"
    rating: float = 0.0
    reviews_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_available: bool = True
    is_provider_mode: bool = False
    bank_details: Optional[Dict[str, str]] = None
    phone: Optional[str] = None
    profile_slug: Optional[str] = None
    email_verified: bool = False
    organization: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    location: Optional[Dict[str, float]] = None
    city: Optional[str] = None
    categories: Optional[List[str]] = None
    subcategories: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    is_available: Optional[bool] = None
    is_provider_mode: Optional[bool] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bank_details: Optional[Dict[str, str]] = None
    organization: Optional[str] = None
    user_type: Optional[str] = None

class PortfolioItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = ""
    image: Optional[str] = None
    media: List[str] = []
    categories: List[str] = []
    completion_date: Optional[str] = None
    youtube_url: Optional[str] = None
    spotify_url: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    external_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PortfolioCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    image: Optional[str] = None
    media: List[str] = []
    categories: List[str] = []
    category: Optional[str] = None  # backward compat
    completion_date: Optional[str] = None
    youtube_url: Optional[str] = None
    spotify_url: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    external_url: Optional[str] = None

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    freelancer_id: str
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    price: float
    price_unit: str = "fixed"  # fixed or hourly
    duration_hours: float
    images: List[str] = []
    options: List[ServiceOption] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceCreate(BaseModel):
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    price: float
    price_unit: str = "fixed"
    duration_hours: float
    images: List[str] = []
    options: List[ServiceOptionCreate] = []

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    freelancer_id: str
    service_id: str
    date: datetime
    duration_hours: float
    base_price: float
    selected_options: List[str] = []
    options_total: float = 0.0
    total_price: float
    is_draft: bool = True  # Draft until payment is completed
    status: str = "pending"  # pending (awaiting provider validation), confirmed, cancelled, completed
    payment_status: str = "pending"  # pending, paid, refunded
    notes: Optional[str] = ""
    cancellation_fee: float = 0.0
    cancelled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookingCreate(BaseModel):
    service_id: str
    date: str
    notes: Optional[str] = ""
    selected_options: List[str] = []

class BookingUpdate(BaseModel):
    date: Optional[str] = None
    notes: Optional[str] = None

# Membership model
class Membership(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    is_active: bool = True
    member_number: int = 0
    benefits: List[str] = []
    started_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

SUBSCRIPTION_PLANS = {
    "essentiel": {
        "name": "Essentiel",
        "price": 0,
        "price_id": None,  # Free tier
        "services": 1,
        "commission": 15,
        "payout": "Mensuel",
        "features": ["1 service", "Commission 15%", "Versement mensuel", "Accès au tableau de bord"]
    },
    "standard": {
        "name": "Standard",
        "price": 2.99,
        "price_id": "price_standard_monthly",  # Will be created dynamically
        "services": 2,
        "commission": 6,
        "payout": "Tous les 15 jours",
        "features": ["2 services", "Commission 6%", "Versement tous les 15 jours", "Support téléphonique 7/7", "Accès au tableau de bord"]
    },
    "business": {
        "name": "Business",
        "price": 7.99,
        "price_id": "price_business_monthly",  # Will be created dynamically
        "services": 3,
        "commission": 0,
        "payout": "Instantané",
        "features": ["3 services", "0% commission", "Versement instantané", "Support téléphonique 7/7", "Accès au tableau de bord"]
    }
}

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_id: str
    receiver_id: str
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participants: List[str]
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    reviewer_id: str
    freelancer_id: str
    rating: float
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewCreate(BaseModel):
    booking_id: str
    rating: float
    comment: str

class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    freelancer_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class CashRegisterEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    freelancer_id: str
    booking_id: str
    amount: float
    commission: float
    net_amount: float
    status: str = "pending"  # pending, available, withdrawn
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== HELPER FUNCTIONS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km using Haversine formula"""
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def distance_to_minutes(distance_km: float, speed_kmh: float = 40) -> float:
    return (distance_km / speed_kmh) * 60

def calculate_cancellation_fee(booking_date: datetime, total_price: float) -> tuple:
    """Calculate cancellation fee based on time before booking"""
    now = datetime.utcnow()
    hours_until_booking = (booking_date - now).total_seconds() / 3600
    
    if hours_until_booking > 72:
        return 0.0, "Gratuit (plus de 72h avant)"
    elif hours_until_booking > 48:
        return total_price * 0.30, "30% de frais (moins de 72h)"
    elif hours_until_booking > 24:
        return total_price * 0.30, "30% de frais (moins de 48h)"
    else:
        return total_price, "100% de frais (moins de 24h)"

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà enregistré")
    
    user_profile = UserProfile(
        email=user.email,
        full_name=user.full_name,
        user_type=user.user_type,
        categories=user.categories if user.user_type == "freelancer" else [],
        subcategories=user.subcategories if user.user_type == "freelancer" else [],
        is_provider_mode=True if user.user_type == "freelancer" else False,
        email_verified=False,
    )
    
    # Generate unique profile slug for shareable link
    base_slug = generate_slug(user.full_name)
    slug = base_slug
    counter = 1
    while await db.users.find_one({"profile_slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    user_dict = user_profile.dict()
    user_dict["hashed_password"] = get_password_hash(user.password)
    user_dict["profile_slug"] = slug
    
    await db.users.insert_one(user_dict)
    access_token = create_access_token(data={"sub": user_profile.id})
    del user_dict["hashed_password"]
    user_dict.pop("_id", None)
    
    # Send email verification code
    code = generate_verification_code()
    await db.email_verifications.delete_many({"email": user.email})
    await db.email_verifications.insert_one({
        "email": user.email,
        "user_id": user_profile.id,
        "code": code,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    })
    
    # Send verification email
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #DC1B78;">Bienvenue sur Harmoo !</h2>
        <p>Bonjour {user.full_name},</p>
        <p>Votre code de vérification est :</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            {code}
        </div>
        <p>Ce code expire dans 24 heures.</p>
        <p>À bientôt,<br>L'équipe Harmoo</p>
    </div>
    """
    await send_email(user.email, "Vérifiez votre email - Harmoo", html)
    
    # PERF: Replace base64 avatar with URL
    if user_dict.get("avatar", "").startswith("data:image"):
        user_dict["avatar"] = f"/api/avatar/{user_dict['id']}"
    
    return Token(access_token=access_token, token_type="bearer", user=user_dict)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_data = {k: v for k, v in user.items() if k != "hashed_password" and k != "_id"}
    
    # PERF: Replace base64 avatar with URL to avoid sending MB of data
    if user_data.get("avatar", "").startswith("data:image"):
        user_data["avatar"] = f"/api/avatar/{user_data['id']}"
    
    return Token(access_token=access_token, token_type="bearer", user=user_data)

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_data = {k: v for k, v in current_user.items() if k != "hashed_password" and k != "_id"}
    # PERF: Replace base64 avatar with URL
    if user_data.get("avatar", "").startswith("data:image"):
        user_data["avatar"] = f"/api/avatar/{user_data['id']}"
    return user_data

# ==================== EMAIL VERIFICATION ====================

@api_router.post("/auth/verify-email")
async def verify_email(data: dict, current_user: dict = Depends(get_current_user)):
    """Verify user email with 6-digit code"""
    code = data.get("code", "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="Code requis")
    
    record = await db.email_verifications.find_one({
        "user_id": current_user["id"],
        "code": code
    })
    
    if not record:
        raise HTTPException(status_code=400, detail="Code invalide")
    
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Code expiré")
    
    # Mark email as verified
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"email_verified": True}}
    )
    await db.email_verifications.delete_many({"user_id": current_user["id"]})
    
    return {"message": "Email vérifié avec succès", "email_verified": True}

@api_router.post("/auth/resend-verification")
async def resend_verification(current_user: dict = Depends(get_current_user)):
    """Resend email verification code"""
    if current_user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email déjà vérifié")
    
    code = generate_verification_code()
    await db.email_verifications.delete_many({"user_id": current_user["id"]})
    await db.email_verifications.insert_one({
        "email": current_user["email"],
        "user_id": current_user["id"],
        "code": code,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    })
    
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #DC1B78;">Vérification de votre email</h2>
        <p>Bonjour {current_user['full_name']},</p>
        <p>Votre nouveau code de vérification est :</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            {code}
        </div>
        <p>Ce code expire dans 24 heures.</p>
        <p>À bientôt,<br>L'équipe Harmoo</p>
    </div>
    """
    await send_email(current_user["email"], "Nouveau code de vérification - Harmoo", html)
    
    return {"message": "Code envoyé"}

# ==================== PASSWORD RESET ====================

@api_router.post("/auth/forgot-password")
async def forgot_password(data: dict):
    email = data.get("email", "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")
    
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Aucun compte trouvé avec cet email")
    
    # Generate 6-digit code
    code = generate_verification_code()
    
    # Store code in DB with expiration (10 minutes)
    await db.reset_codes.delete_many({"email": email})
    await db.reset_codes.insert_one({
        "email": email,
        "code": code,
        "created_at": datetime.utcnow(),
    })
    
    # Send email with code
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #DC1B78;">Réinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Votre code de récupération est :</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            {code}
        </div>
        <p>Ce code expire dans 10 minutes.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <p>À bientôt,<br>L'équipe Harmoo</p>
    </div>
    """
    await send_email(email, "Code de récupération - Harmoo", html)
    
    return {"message": "Code envoyé"}

@api_router.post("/auth/verify-reset-code")
async def verify_reset_code(data: dict):
    email = data.get("email", "").strip()
    code = data.get("code", "").strip()
    
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email et code requis")
    
    record = await db.reset_codes.find_one({"email": email, "code": code})
    if not record:
        raise HTTPException(status_code=400, detail="Code invalide")
    
    # Check expiration (10 minutes)
    if (datetime.utcnow() - record["created_at"]).total_seconds() > 600:
        await db.reset_codes.delete_many({"email": email})
        raise HTTPException(status_code=400, detail="Code expiré")
    
    return {"message": "Code vérifié", "valid": True}

@api_router.post("/auth/reset-password")
async def reset_password(data: dict):
    email = data.get("email", "").strip()
    code = data.get("code", "").strip()
    new_password = data.get("new_password", "")
    
    if not email or not code or not new_password:
        raise HTTPException(status_code=400, detail="Tous les champs sont requis")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères")
    
    record = await db.reset_codes.find_one({"email": email, "code": code})
    if not record:
        raise HTTPException(status_code=400, detail="Code invalide")
    
    # Update password
    hashed = get_password_hash(new_password)
    await db.users.update_one({"email": email}, {"$set": {"hashed_password": hashed}})
    await db.reset_codes.delete_many({"email": email})
    
    return {"message": "Mot de passe modifié avec succès"}

# ==================== USER PROFILE ENDPOINTS ====================

@api_router.put("/users/profile")
async def update_profile(
    update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": current_user["id"]})
    user_data = {k: v for k, v in updated_user.items() if k != "hashed_password" and k != "_id"}
    return user_data

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    user_data = {k: v for k, v in user.items() if k != "hashed_password" and k != "_id"}
    return user_data

# ==================== FREELANCER DISCOVERY ENDPOINTS ====================

@api_router.get("/freelancers")
async def get_freelancers(
    category: Optional[str] = None,
    subcategories: Optional[str] = None,  # Comma-separated list
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    max_distance_minutes: int = 30,
    is_available: Optional[bool] = True,
    search: Optional[str] = None,
    exclude_user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {"is_provider_mode": True, "is_seed": {"$ne": True}}
    
    # Exclude user's own profile from suggestions
    if exclude_user_id:
        query["id"] = {"$ne": exclude_user_id}
    
    if category:
        query["categories"] = {"$in": [category]}
    
    if subcategories:
        subcat_list = [s.strip() for s in subcategories.split(",")]
        query["subcategories"] = {"$in": subcat_list}
    
    if min_price is not None:
        query["hourly_rate"] = {"$gte": min_price}
    
    if max_price is not None:
        if "hourly_rate" in query:
            query["hourly_rate"]["$lte"] = max_price
        else:
            query["hourly_rate"] = {"$lte": max_price}
    
    # Don't filter by is_available to include all freelancers
    
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"bio": {"$regex": search, "$options": "i"}},
            {"categories": {"$regex": search, "$options": "i"}},
            {"subcategories": {"$regex": search, "$options": "i"}}
        ]
    
    # PERF: Use INCLUSION projection - only fetch needed fields, skip heavy base64 data
    projection = {
        "_id": 0, "id": 1, "full_name": 1, "email": 1, "bio": 1,
        "user_type": 1, "categories": 1, "subcategories": 1,
        "hourly_rate": 1, "city": 1, "location": 1,
        "is_available": 1, "is_provider_mode": 1,
        "is_harmoo_club": 1, "club_joined_at": 1,
        "rating": 1, "total_reviews": 1, "profile_slug": 1,
        "organization": 1, "created_at": 1,
    }
    freelancers_cursor = db.users.find(query, projection).skip(skip).limit(limit * 3)
    freelancers = await freelancers_cursor.to_list(limit * 3)
    
    result = []
    for freelancer in freelancers:
        freelancer_data = dict(freelancer)
        
        # PERF: Set avatar to URL endpoint instead of base64
        freelancer_data["avatar"] = f"/api/avatar/{freelancer_data['id']}"
        
        if lat is not None and lng is not None and freelancer.get("location"):
            distance_km = calculate_distance(
                lat, lng,
                freelancer["location"]["lat"],
                freelancer["location"]["lng"]
            )
            travel_minutes = distance_to_minutes(distance_km)
            
            if travel_minutes <= max_distance_minutes:
                freelancer_data["distance_km"] = round(distance_km, 1)
                freelancer_data["travel_minutes"] = round(travel_minutes)
                result.append(freelancer_data)
        else:
            freelancer_data["distance_km"] = None
            freelancer_data["travel_minutes"] = None
            result.append(freelancer_data)
    
    # Sort by distance (closest first), then by rating
    if lat is not None and lng is not None:
        result.sort(key=lambda x: (x.get("travel_minutes") or 9999, -(x.get("rating") or 0)))
    else:
        result.sort(key=lambda x: -(x.get("rating") or 0))
    
    return result[:limit]

@api_router.get("/freelancers/{freelancer_id}")
async def get_freelancer(freelancer_id: str):
    # Try to find by ID first, then by profile_slug
    freelancer = await db.users.find_one({"id": freelancer_id, "user_type": "freelancer"})
    if not freelancer:
        freelancer = await db.users.find_one({"profile_slug": freelancer_id, "user_type": "freelancer"})
    if not freelancer:
        # Also check if is_provider_mode is true (for users who are freelancers)
        freelancer = await db.users.find_one({"id": freelancer_id, "is_provider_mode": True})
    if not freelancer:
        freelancer = await db.users.find_one({"profile_slug": freelancer_id, "is_provider_mode": True})
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelance non trouvé")
    
    freelancer_data = {k: v for k, v in freelancer.items() if k != "hashed_password" and k != "_id"}
    
    portfolio = await db.portfolio.find({"user_id": freelancer["id"]}).to_list(50)
    freelancer_data["portfolio"] = [{k: v for k, v in p.items() if k != "_id"} for p in portfolio]
    
    services = await db.services.find({"freelancer_id": freelancer["id"], "is_active": True}).to_list(50)
    freelancer_data["services"] = [{k: v for k, v in s.items() if k != "_id"} for s in services]
    
    reviews = await db.reviews.find({"freelancer_id": freelancer["id"]}).to_list(50)
    freelancer_data["reviews"] = [{k: v for k, v in r.items() if k != "_id"} for r in reviews]
    
    return freelancer_data

# ==================== PORTFOLIO ENDPOINTS ====================

@api_router.post("/portfolio")
async def create_portfolio_item(
    item: PortfolioCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "freelancer":
        raise HTTPException(status_code=403, detail="Seuls les freelances peuvent créer des éléments de portfolio")
    
    item_data = item.dict()
    # backward compat: if old 'category' field sent, convert to categories list
    if item_data.get("category") and not item_data.get("categories"):
        item_data["categories"] = [item_data["category"]]
    item_data.pop("category", None)
    
    portfolio_item = PortfolioItem(user_id=current_user["id"], **item_data)
    await db.portfolio.insert_one(portfolio_item.dict())
    return portfolio_item.dict()

@api_router.get("/portfolio")
async def get_my_portfolio(current_user: dict = Depends(get_current_user)):
    portfolio = await db.portfolio.find({"user_id": current_user["id"]}).to_list(50)
    return [{k: v for k, v in p.items() if k != "_id"} for p in portfolio]

@api_router.put("/portfolio/{item_id}")
async def update_portfolio_item(item_id: str, item: PortfolioCreate, current_user: dict = Depends(get_current_user)):
    item_data = item.dict()
    if item_data.get("category") and not item_data.get("categories"):
        item_data["categories"] = [item_data["category"]]
    item_data.pop("category", None)
    
    result = await db.portfolio.update_one(
        {"id": item_id, "user_id": current_user["id"]},
        {"$set": item_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    updated = await db.portfolio.find_one({"id": item_id})
    return {k: v for k, v in updated.items() if k != "_id"}

@api_router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.portfolio.delete_one({"id": item_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    return {"message": "Élément supprimé"}

# ==================== SERVICE ENDPOINTS ====================

@api_router.post("/services")
async def create_service(
    service: ServiceCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "freelancer":
        raise HTTPException(status_code=403, detail="Seuls les freelances peuvent créer des services")
    
    tier = current_user.get("subscription_tier", "essentiel")
    max_services = SERVICE_LIMITS.get(tier, 1)
    
    existing_services = await db.services.count_documents({"freelancer_id": current_user["id"], "is_active": True})
    if existing_services >= max_services:
        raise HTTPException(
            status_code=403, 
            detail=f"Limite de services atteinte ({max_services}) pour l'abonnement {tier}. Passez à un abonnement supérieur."
        )
    
    # Convert options
    options = [ServiceOption(**opt.dict()) for opt in service.options]
    
    service_obj = Service(
        freelancer_id=current_user["id"],
        title=service.title,
        description=service.description,
        category=service.category,
        subcategory=service.subcategory,
        price=service.price,
        price_unit=service.price_unit,
        duration_hours=service.duration_hours,
        images=service.images,
        options=options
    )
    
    await db.services.insert_one(service_obj.dict())
    return service_obj.dict()

@api_router.get("/services")
async def get_my_services(current_user: dict = Depends(get_current_user)):
    services = await db.services.find({"freelancer_id": current_user["id"]}).to_list(50)
    return [{k: v for k, v in s.items() if k != "_id"} for s in services]

@api_router.get("/services/{service_id}")
async def get_service(service_id: str):
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    return {k: v for k, v in service.items() if k != "_id"}

@api_router.put("/services/{service_id}")
async def update_service(
    service_id: str,
    update: ServiceCreate,
    current_user: dict = Depends(get_current_user)
):
    options = [ServiceOption(**opt.dict()).dict() for opt in update.options]
    update_data = update.dict()
    update_data["options"] = options
    
    result = await db.services.update_one(
        {"id": service_id, "freelancer_id": current_user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    
    updated = await db.services.find_one({"id": service_id})
    return {k: v for k, v in updated.items() if k != "_id"}

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.services.delete_one({"id": service_id, "freelancer_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    return {"message": "Service supprimé"}

@api_router.get("/services/limits/info")
async def get_service_limits(current_user: dict = Depends(get_current_user)):
    tier = current_user.get("subscription_tier", "essentiel")
    max_services = SERVICE_LIMITS.get(tier, 1)
    current_count = await db.services.count_documents({"freelancer_id": current_user["id"], "is_active": True})
    
    return {
        "subscription_tier": tier,
        "max_services": max_services,
        "current_services": current_count,
        "can_add_more": current_count < max_services
    }

# ==================== BOOKING ENDPOINTS ====================

@api_router.post("/bookings")
async def create_booking(
    booking: BookingCreate,
    current_user: dict = Depends(get_current_user)
):
    service = await db.services.find_one({"id": booking.service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service non trouvé")
    
    # Calculate options total
    options_total = 0.0
    if booking.selected_options:
        for opt in service.get("options", []):
            if opt["id"] in booking.selected_options:
                options_total += opt["price"]
    
    total_price = service["price"] + options_total
    
    booking_obj = Booking(
        client_id=current_user["id"],
        freelancer_id=service["freelancer_id"],
        service_id=booking.service_id,
        date=datetime.fromisoformat(booking.date.replace('Z', '+00:00')),
        duration_hours=service["duration_hours"],
        base_price=service["price"],
        selected_options=booking.selected_options,
        options_total=options_total,
        total_price=total_price,
        notes=booking.notes
    )
    
    await db.bookings.insert_one(booking_obj.dict())
    return booking_obj.dict()

@api_router.get("/bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    # Only show non-draft bookings (drafts are created before payment and should not appear)
    query = {
        "$and": [
            {"$or": [
                {"client_id": current_user["id"]},
                {"freelancer_id": current_user["id"]}
            ]},
            {"$or": [
                {"is_draft": False},
                {"is_draft": {"$exists": False}, "payment_status": "paid"}  # Legacy bookings
            ]}
        ]
    }
    bookings = await db.bookings.find(query).sort("date", -1).to_list(100)
    
    enriched = []
    for booking in bookings:
        booking_data = {k: v for k, v in booking.items() if k != "_id"}
        
        service = await db.services.find_one({"id": booking["service_id"]})
        if service:
            booking_data["service"] = {k: v for k, v in service.items() if k != "_id"}
        
        other_id = booking["freelancer_id"] if booking["client_id"] == current_user["id"] else booking["client_id"]
        other_user = await db.users.find_one({"id": other_id})
        if other_user:
            booking_data["other_party"] = {
                "id": other_user["id"],
                "full_name": other_user["full_name"],
                "avatar": other_user.get("avatar")
            }
        
        # Calculate cancellation info
        if booking["status"] not in ["cancelled", "completed"]:
            fee, message = calculate_cancellation_fee(booking["date"], booking["total_price"])
            booking_data["cancellation_fee"] = fee
            booking_data["cancellation_message"] = message
        
        enriched.append(booking_data)
    
    return enriched

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    if status == "confirmed" and booking["freelancer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le freelance peut confirmer")
    
    if status == "cancelled" and booking["client_id"] != current_user["id"] and booking["freelancer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status}})
    
    updated = await db.bookings.find_one({"id": booking_id})
    return {k: v for k, v in updated.items() if k != "_id"}

@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    if booking["client_id"] != current_user["id"] and booking["freelancer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if booking["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Réservation déjà annulée")
    
    if booking["status"] == "completed":
        raise HTTPException(status_code=400, detail="Impossible d'annuler une réservation terminée")
    
    # Calculate cancellation fee
    fee, message = calculate_cancellation_fee(booking["date"], booking["total_price"])
    
    # DELETE the cancelled booking from the database
    await db.bookings.delete_one({"id": booking_id})
    
    return {
        "message": "Réservation annulée et supprimée",
        "cancellation_fee": fee,
        "cancellation_message": message
    }

@api_router.put("/bookings/{booking_id}")
async def update_booking(
    booking_id: str,
    update: BookingUpdate,
    current_user: dict = Depends(get_current_user)
):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    if booking["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le client peut modifier la réservation")
    
    if booking["status"] != "pending":
        raise HTTPException(status_code=400, detail="Seules les réservations en attente peuvent être modifiées")
    
    update_data = {}
    if update.date is not None:
        update_data["date"] = datetime.fromisoformat(update.date.replace('Z', '+00:00'))
    if update.notes is not None:
        update_data["notes"] = update.notes
    
    if update_data:
        await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    
    updated = await db.bookings.find_one({"id": booking_id})
    return {k: v for k, v in updated.items() if k != "_id"}

# ==================== PAYMENT ENDPOINTS (MOCK) ====================

@api_router.post("/payments/{booking_id}/pay")
async def process_payment(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    if booking["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    freelancer = await db.users.find_one({"id": booking["freelancer_id"]})
    tier = freelancer.get("subscription_tier", "essentiel")
    commission_rates = {"essentiel": 0.15, "standard": 0.06, "business": 0.0}
    
    # Harmoo Club members are exempt from all commissions
    if freelancer.get("is_harmoo_club"):
        commission = 0.0
    else:
        commission = booking["total_price"] * commission_rates.get(tier, 0.15)
    freelancer_amount = booking["total_price"] - commission
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"payment_status": "paid", "status": "confirmed"}}
    )
    
    # Add to cash register
    cash_entry = CashRegisterEntry(
        freelancer_id=booking["freelancer_id"],
        booking_id=booking_id,
        amount=booking["total_price"],
        commission=commission,
        net_amount=freelancer_amount
    )
    await db.cash_register.insert_one(cash_entry.dict())
    
    payment_record = {
        "id": str(uuid.uuid4()),
        "booking_id": booking_id,
        "client_id": current_user["id"],
        "freelancer_id": booking["freelancer_id"],
        "total_amount": booking["total_price"],
        "commission": commission,
        "freelancer_amount": freelancer_amount,
        "status": "completed",
        "created_at": datetime.utcnow()
    }
    await db.payments.insert_one(payment_record)
    
    return {
        "message": "Paiement réussi",
        "payment_id": payment_record["id"],
        "total_paid": booking["total_price"],
        "commission": commission,
        "freelancer_receives": freelancer_amount
    }

# ==================== STRIPE PAYMENT ENDPOINTS ====================

import stripe
from fastapi import Request

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
stripe.api_key = STRIPE_API_KEY

class CreateCheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

@api_router.post("/stripe/checkout")
async def create_stripe_checkout(
    data: CreateCheckoutRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for a booking"""
    booking = await db.bookings.find_one({"id": data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    if booking["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Déjà payé")
    
    amount = float(booking["total_price"])
    success_url = f"{data.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/booking/{booking['service_id']}"
    
    # Create Stripe checkout session
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "unit_amount": int(amount * 100),
                "product_data": {
                    "name": "Réservation Harmoo",
                }
            },
            "quantity": 1
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": data.booking_id,
            "client_id": current_user["id"],
            "freelancer_id": booking["freelancer_id"]
        }
    )
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.id,
        "booking_id": data.booking_id,
        "client_id": current_user["id"],
        "freelancer_id": booking["freelancer_id"],
        "amount": amount,
        "currency": "eur",
        "payment_status": "pending",
        "created_at": datetime.utcnow()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"url": session.url, "session_id": session.id}

@api_router.get("/stripe/status/{session_id}")
async def get_stripe_payment_status(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get payment status and update booking if paid"""
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    if transaction["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if transaction["payment_status"] == "paid":
        return {"status": "complete", "payment_status": "paid"}
    
    # Get status from Stripe
    session = stripe.checkout.Session.retrieve(session_id)
    payment_status = "paid" if session.payment_status == "paid" else "pending"
    
    # Update transaction and booking if paid
    if payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "updated_at": datetime.utcnow()}}
        )
        
        booking = await db.bookings.find_one({"id": transaction["booking_id"]})
        freelancer = await db.users.find_one({"id": transaction["freelancer_id"]})
        tier = freelancer.get("subscription_tier", "essentiel") if freelancer else "essentiel"
        commission_rates = {"essentiel": 0.15, "standard": 0.06, "business": 0.0}
        
        # Harmoo Club members are exempt from all commissions
        if freelancer and freelancer.get("is_harmoo_club"):
            commission = 0.0
        else:
            commission = transaction["amount"] * commission_rates.get(tier, 0.15)
        freelancer_amount = transaction["amount"] - commission
        
        await db.bookings.update_one(
            {"id": transaction["booking_id"]},
            {"$set": {
                "is_draft": False,
                "payment_status": "paid",
                "status": "pending"
            }}
        )
        
        cash_entry = {
            "id": str(uuid.uuid4()),
            "freelancer_id": transaction["freelancer_id"],
            "booking_id": transaction["booking_id"],
            "amount": transaction["amount"],
            "commission": commission,
            "net_amount": freelancer_amount,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        await db.cash_register.insert_one(cash_entry)
        
        if freelancer and booking:
            client = await db.users.find_one({"id": booking["client_id"]})
            service = await db.services.find_one({"id": booking["service_id"]})
            booking_date = booking["date"].strftime("%d/%m/%Y à %H:%M") if booking.get("date") else "Non défini"
            
            html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #DC1B78;">🎉 Nouvelle réservation !</h2>
                <p>Bonjour {freelancer['full_name']},</p>
                <p>Vous avez reçu une nouvelle demande de réservation :</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Client :</strong> {client['full_name'] if client else 'Non défini'}</p>
                    <p><strong>Service :</strong> {service['title'] if service else 'Non défini'}</p>
                    <p><strong>Date :</strong> {booking_date}</p>
                    <p><strong>Montant :</strong> {transaction['amount']}€</p>
                </div>
                <p style="color: #e74c3c;"><strong>⚠️ Action requise :</strong> Vous avez 24h pour confirmer ou refuser cette réservation.</p>
                <p>Connectez-vous à l'application pour valider la demande.</p>
                <p>À bientôt,<br>L'équipe Harmoo</p>
            </div>
            """
            await send_email(freelancer["email"], "🎉 Nouvelle réservation à valider - Harmoo", html)
    
    return {
        "status": session.status,
        "payment_status": payment_status,
        "amount": session.amount_total / 100 if session.amount_total else 0,
        "currency": session.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    
    try:
        event = stripe.Event.construct_from(
            stripe.util.json.loads(body), stripe.api_key
        )
        
        if event.type == "checkout.session.completed":
            session = event.data.object
            session_id = session.id
            
            if session.payment_status == "paid":
                transaction = await db.payment_transactions.find_one({"session_id": session_id})
                
                if transaction and transaction["payment_status"] != "paid":
                    await db.payment_transactions.update_one(
                        {"session_id": session_id},
                        {"$set": {"payment_status": "paid", "updated_at": datetime.utcnow()}}
                    )
                    
                    await db.bookings.update_one(
                        {"id": transaction["booking_id"]},
                        {"$set": {
                            "is_draft": False,
                            "payment_status": "paid",
                            "status": "pending"
                        }}
                    )
                    
                    booking = await db.bookings.find_one({"id": transaction["booking_id"]})
                    freelancer = await db.users.find_one({"id": transaction["freelancer_id"]})
                    if freelancer and booking:
                        client = await db.users.find_one({"id": booking["client_id"]})
                        service = await db.services.find_one({"id": booking["service_id"]})
                        booking_date = booking["date"].strftime("%d/%m/%Y à %H:%M") if booking.get("date") else "Non défini"
                        
                        html = f"""
                        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                            <h2 style="color: #DC1B78;">🎉 Nouvelle réservation !</h2>
                            <p>Bonjour {freelancer['full_name']},</p>
                            <p>Vous avez reçu une nouvelle demande de réservation :</p>
                            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <p><strong>Client :</strong> {client['full_name'] if client else 'Non défini'}</p>
                                <p><strong>Service :</strong> {service['title'] if service else 'Non défini'}</p>
                                <p><strong>Date :</strong> {booking_date}</p>
                                <p><strong>Montant :</strong> {transaction['amount']}€</p>
                            </div>
                            <p style="color: #e74c3c;"><strong>⚠️ Action requise :</strong> Vous avez 24h pour confirmer ou refuser cette réservation.</p>
                            <p>Connectez-vous à l'application pour valider la demande.</p>
                            <p>À bientôt,<br>L'équipe Harmoo</p>
                        </div>
                        """
                        await send_email(freelancer["email"], "🎉 Nouvelle réservation à valider - Harmoo", html)
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ==================== SUBSCRIPTION ENDPOINTS ====================

stripe.api_key = STRIPE_API_KEY

class SubscriptionRequest(BaseModel):
    tier: str
    origin_url: str

@api_router.post("/subscriptions/checkout")
async def create_subscription_checkout(
    data: SubscriptionRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription"""
    if data.tier not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Formule invalide")
    
    plan = SUBSCRIPTION_PLANS[data.tier]
    
    if plan["price"] == 0:
        # Free tier - just update directly
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"subscription_tier": data.tier, "subscription_status": "active"}}
        )
        return {"status": "free", "tier": data.tier}
    
    # Get or create Stripe customer
    user = await db.users.find_one({"id": current_user["id"]})
    customer_id = user.get("stripe_customer_id")
    
    # Verify customer exists in Stripe, recreate if not
    if customer_id:
        try:
            stripe.Customer.retrieve(customer_id)
        except stripe.error.InvalidRequestError:
            customer_id = None  # Customer doesn't exist, will recreate
    
    if not customer_id:
        customer = stripe.Customer.create(
            email=user["email"],
            name=user.get("full_name", ""),
            metadata={"user_id": current_user["id"]}
        )
        customer_id = customer.id
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"stripe_customer_id": customer_id}}
        )
    
    # Create or get price for this plan
    price_id = await get_or_create_price(data.tier, plan)
    
    # Create checkout session for subscription
    success_url = f"{data.origin_url}/subscription-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/membership"
    
    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": current_user["id"], "tier": data.tier}
    )
    
    return {"url": session.url, "session_id": session.id}

async def get_or_create_price(tier: str, plan: dict) -> str:
    """Get existing price or create new one in Stripe"""
    # Check if we have a stored price ID
    existing = await db.stripe_prices.find_one({"tier": tier})
    if existing:
        # Verify price still exists in Stripe
        try:
            stripe.Price.retrieve(existing["price_id"])
            return existing["price_id"]
        except stripe.error.InvalidRequestError:
            # Price doesn't exist, delete old record
            await db.stripe_prices.delete_one({"tier": tier})
    
    # Create product and price in Stripe
    product = stripe.Product.create(
        name=f"Harmoo {plan['name']}",
        description=f"Abonnement mensuel {plan['name']}",
        metadata={"tier": tier}
    )
    
    price = stripe.Price.create(
        product=product.id,
        unit_amount=int(plan["price"] * 100),  # Convert to cents
        currency="eur",
        recurring={"interval": "month"}
    )
    
    # Store for future use
    await db.stripe_prices.insert_one({
        "tier": tier,
        "price_id": price.id,
        "product_id": product.id,
        "created_at": datetime.utcnow()
    })
    
    return price.id

@api_router.get("/subscriptions/status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    """Get current subscription status"""
    user = await db.users.find_one({"id": current_user["id"]})
    
    tier = user.get("subscription_tier", "essentiel")
    plan = SUBSCRIPTION_PLANS.get(tier, SUBSCRIPTION_PLANS["essentiel"])
    
    subscription_info = {
        "tier": tier,
        "plan": plan,
        "status": user.get("subscription_status", "active"),
        "stripe_subscription_id": user.get("stripe_subscription_id"),
        "current_period_end": user.get("subscription_period_end"),
        "cancel_at_period_end": user.get("cancel_at_period_end", False)
    }
    
    return subscription_info

@api_router.post("/subscriptions/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancel subscription at end of billing period"""
    user = await db.users.find_one({"id": current_user["id"]})
    
    subscription_id = user.get("stripe_subscription_id")
    if not subscription_id:
        # Just downgrade to free
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"subscription_tier": "essentiel", "subscription_status": "active"}}
        )
        return {"message": "Abonnement annulé", "effective_date": "immediate"}
    
    # Cancel at period end in Stripe
    subscription = stripe.Subscription.modify(
        subscription_id,
        cancel_at_period_end=True
    )
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"cancel_at_period_end": True}}
    )
    
    return {
        "message": "Votre abonnement sera annulé à la fin de la période",
        "effective_date": datetime.fromtimestamp(subscription.current_period_end).isoformat()
    }

@api_router.post("/subscriptions/reactivate")
async def reactivate_subscription(current_user: dict = Depends(get_current_user)):
    """Reactivate a cancelled subscription"""
    user = await db.users.find_one({"id": current_user["id"]})
    
    subscription_id = user.get("stripe_subscription_id")
    if not subscription_id:
        raise HTTPException(status_code=400, detail="Aucun abonnement à réactiver")
    
    stripe.Subscription.modify(
        subscription_id,
        cancel_at_period_end=False
    )
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"cancel_at_period_end": False}}
    )
    
    return {"message": "Abonnement réactivé"}

@api_router.get("/subscriptions/verify/{session_id}")
async def verify_subscription(session_id: str, current_user: dict = Depends(get_current_user)):
    """Verify subscription after checkout"""
    session = stripe.checkout.Session.retrieve(session_id)
    
    if session.payment_status == "paid" and session.subscription:
        subscription = stripe.Subscription.retrieve(session.subscription)
        tier = session.metadata.get("tier", "standard")
        
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {
                "subscription_tier": tier,
                "subscription_status": "active",
                "stripe_subscription_id": subscription.id,
                "subscription_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "cancel_at_period_end": False
            }}
        )
        
        return {"status": "active", "tier": tier}
    
    return {"status": "pending"}

@api_router.post("/webhook/stripe-subscription")
async def stripe_subscription_webhook(request: Request):
    """Handle Stripe subscription webhooks"""
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    
    try:
        # For simplicity, we'll handle events without signature verification
        # In production, use webhook secret for verification
        event_data = await request.json()
        event_type = event_data.get("type")
        
        if event_type == "customer.subscription.updated":
            subscription = event_data["data"]["object"]
            customer_id = subscription["customer"]
            
            user = await db.users.find_one({"stripe_customer_id": customer_id})
            if user:
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "subscription_status": subscription["status"],
                        "subscription_period_end": datetime.fromtimestamp(subscription["current_period_end"]),
                        "cancel_at_period_end": subscription.get("cancel_at_period_end", False)
                    }}
                )
        
        elif event_type == "customer.subscription.deleted":
            subscription = event_data["data"]["object"]
            customer_id = subscription["customer"]
            
            user = await db.users.find_one({"stripe_customer_id": customer_id})
            if user:
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "subscription_tier": "essentiel",
                        "subscription_status": "cancelled",
                        "stripe_subscription_id": None
                    }}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Subscription webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ==================== HARMOO CLUB ENDPOINTS ====================

CLUB_PRICE = 60  # €
CLUB_MAX_MEMBERS = 10

ADMIN_EMAIL = "alvin.m11@yahoo.com"

@api_router.post("/admin/set-club-badge")
async def admin_set_club_badge(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin only")
    names = data.get("names", [])
    results = []
    for name in names:
        r = await db.users.update_many(
            {"full_name": {"$regex": name, "$options": "i"}},
            {"$set": {"is_harmoo_club": True, "club_joined_at": datetime.utcnow()}}
        )
        results.append({"name": name, "updated": r.modified_count})
    return {"results": results}

@api_router.get("/admin/init-club-badges")
async def init_club_badges():
    """One-time init endpoint to set club badges for founding members"""
    names = ["Flavie", "Fournier"]
    results = []
    for name in names:
        r = await db.users.update_many(
            {"full_name": {"$regex": name, "$options": "i"}},
            {"$set": {"is_harmoo_club": True, "club_joined_at": datetime.utcnow()}}
        )
        results.append({"name": name, "updated": r.modified_count})
    return {"results": results}

@api_router.get("/club/count")
async def get_club_count():
    """Get current number of Harmoo Club members"""
    count = await db.users.count_documents({"is_harmoo_club": True})
    return {"count": count, "max": CLUB_MAX_MEMBERS}

@api_router.post("/club/checkout")
async def create_club_checkout(data: dict, request: Request, current_user: dict = Depends(get_current_user)):
    """Create Stripe checkout for Harmoo Club lifetime membership"""
    origin_url = data.get("origin_url", str(request.base_url))
    
    # Check if already a member
    if current_user.get("is_harmoo_club"):
        raise HTTPException(status_code=400, detail="Vous êtes déjà membre du Club")
    
    # Check if club is full
    count = await db.users.count_documents({"is_harmoo_club": True})
    if count >= CLUB_MAX_MEMBERS:
        raise HTTPException(status_code=400, detail="Le Club est complet")
    
    # Get or create Stripe customer
    user = await db.users.find_one({"id": current_user["id"]})
    customer_id = user.get("stripe_customer_id")
    
    # Verify customer exists in Stripe, recreate if not
    if customer_id:
        try:
            stripe.Customer.retrieve(customer_id)
        except stripe.error.InvalidRequestError:
            customer_id = None  # Customer doesn't exist, will recreate
    
    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user["email"],
            name=current_user["full_name"],
            metadata={"user_id": current_user["id"]}
        )
        customer_id = customer.id
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"stripe_customer_id": customer_id}}
        )
    
    # Create one-time payment checkout session
    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "unit_amount": CLUB_PRICE * 100,  # in cents
                "product_data": {
                    "name": "Harmoo Club - Adhésion à vie",
                    "description": "Badge Club, événements exclusifs, réductions sur les prestations"
                }
            },
            "quantity": 1
        }],
        mode="payment",
        success_url=f"{origin_url}/club-success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin_url}/membership",
        metadata={"user_id": current_user["id"], "type": "club_membership"}
    )
    
    return {"checkout_url": session.url, "session_id": session.id}

@api_router.get("/club/verify/{session_id}")
async def verify_club_payment(session_id: str, current_user: dict = Depends(get_current_user)):
    """Verify club payment and activate membership"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == "paid" and session.metadata.get("type") == "club_membership":
            # Activate club membership
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"is_harmoo_club": True, "club_joined_at": datetime.utcnow()}}
            )
            return {"status": "success", "is_harmoo_club": True}
        else:
            return {"status": "pending"}
    except Exception as e:
        logger.error(f"Club verification error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ==================== CASH REGISTER ENDPOINTS ====================

@api_router.get("/cash-register")
async def get_cash_register(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "freelancer":
        raise HTTPException(status_code=403, detail="Freelance uniquement")
    
    entries = await db.cash_register.find({"freelancer_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    
    total_amount = sum(e["net_amount"] for e in entries)
    pending_amount = sum(e["net_amount"] for e in entries if e["status"] == "pending")
    available_amount = sum(e["net_amount"] for e in entries if e["status"] == "available")
    
    return {
        "entries": [{k: v for k, v in e.items() if k != "_id"} for e in entries],
        "total_amount": total_amount,
        "pending_amount": pending_amount,
        "available_amount": available_amount
    }

class BankDetailsUpdate(BaseModel):
    iban: str
    bic: str
    account_holder: str

@api_router.put("/users/bank-details")
async def update_bank_details(
    details: BankDetailsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's bank details for payouts"""
    # Basic IBAN validation
    iban = details.iban.replace(" ", "").upper()
    if len(iban) < 15 or len(iban) > 34:
        raise HTTPException(status_code=400, detail="IBAN invalide")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "bank_details": {
                "iban": iban,
                "bic": details.bic.upper(),
                "account_holder": details.account_holder,
                "updated_at": datetime.utcnow()
            }
        }}
    )
    
    return {"message": "Coordonnées bancaires mises à jour"}

@api_router.get("/users/bank-details")
async def get_bank_details(current_user: dict = Depends(get_current_user)):
    """Get user's bank details"""
    user = await db.users.find_one({"id": current_user["id"]})
    bank_details = user.get("bank_details", {})
    
    # Mask IBAN for security (show only last 4 digits)
    if bank_details.get("iban"):
        iban = bank_details["iban"]
        bank_details["iban_masked"] = "****" + iban[-4:]
    
    return bank_details

class WithdrawalRequest(BaseModel):
    amount: float

@api_router.post("/cash-register/withdraw")
async def request_withdrawal(
    request: WithdrawalRequest,
    current_user: dict = Depends(get_current_user)
):
    """Request a withdrawal to bank account"""
    if current_user.get("user_type") != "freelancer":
        raise HTTPException(status_code=403, detail="Freelance uniquement")
    
    # Check bank details exist
    user = await db.users.find_one({"id": current_user["id"]})
    if not user.get("bank_details", {}).get("iban"):
        raise HTTPException(status_code=400, detail="Veuillez d'abord ajouter vos coordonnées bancaires")
    
    # Get available balance
    entries = await db.cash_register.find({
        "freelancer_id": current_user["id"],
        "status": "available"
    }).to_list(1000)
    
    available_amount = sum(e["net_amount"] for e in entries)
    
    if request.amount > available_amount:
        raise HTTPException(status_code=400, detail=f"Solde insuffisant. Disponible: {available_amount:.2f}€")
    
    if request.amount < 10:
        raise HTTPException(status_code=400, detail="Retrait minimum: 10€")
    
    # Get payout schedule based on tier
    tier = user.get("subscription_tier", "essentiel")
    payout_schedule = SUBSCRIPTION_PLANS.get(tier, {}).get("payout", "Mensuel")
    
    # Create withdrawal record
    withdrawal = {
        "id": str(uuid.uuid4()),
        "freelancer_id": current_user["id"],
        "amount": request.amount,
        "status": "pending",
        "payout_schedule": payout_schedule,
        "bank_iban_last4": user["bank_details"]["iban"][-4:],
        "created_at": datetime.utcnow(),
        "estimated_arrival": get_estimated_arrival(tier)
    }
    
    await db.withdrawals.insert_one(withdrawal)
    
    # Mark cash register entries as withdrawn
    remaining = request.amount
    for entry in entries:
        if remaining <= 0:
            break
        if entry["net_amount"] <= remaining:
            await db.cash_register.update_one(
                {"id": entry["id"]},
                {"$set": {"status": "withdrawn", "withdrawal_id": withdrawal["id"]}}
            )
            remaining -= entry["net_amount"]
        else:
            # Partial withdrawal - split entry
            await db.cash_register.update_one(
                {"id": entry["id"]},
                {"$set": {"net_amount": entry["net_amount"] - remaining, "amount": entry["amount"] - remaining}}
            )
            remaining = 0
    
    return {
        "message": "Demande de retrait enregistrée",
        "withdrawal_id": withdrawal["id"],
        "amount": request.amount,
        "estimated_arrival": withdrawal["estimated_arrival"].isoformat(),
        "payout_schedule": payout_schedule
    }

def get_estimated_arrival(tier: str) -> datetime:
    """Get estimated arrival date based on subscription tier"""
    now = datetime.utcnow()
    if tier == "business":
        return now + timedelta(hours=2)  # Instant = 2h max
    elif tier == "standard":
        return now + timedelta(days=15)
    else:  # essentiel
        return now + timedelta(days=30)

@api_router.get("/withdrawals")
async def get_withdrawals(current_user: dict = Depends(get_current_user)):
    """Get user's withdrawal history"""
    withdrawals = await db.withdrawals.find(
        {"freelancer_id": current_user["id"]}
    ).sort("created_at", -1).to_list(50)
    
    return [{k: v for k, v in w.items() if k != "_id"} for w in withdrawals]

# ==================== MESSAGING ENDPOINTS ====================

@api_router.post("/messages")
async def send_message(
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    participants = sorted([current_user["id"], message.receiver_id])
    conversation = await db.conversations.find_one({"participants": participants})
    
    if not conversation:
        conversation = Conversation(participants=participants)
        await db.conversations.insert_one(conversation.dict())
        conversation = conversation.dict()
    
    msg = Message(
        conversation_id=conversation["id"],
        sender_id=current_user["id"],
        receiver_id=message.receiver_id,
        content=message.content,
        file_url=message.file_url,
        file_name=message.file_name
    )
    
    await db.messages.insert_one(msg.dict())
    
    await db.conversations.update_one(
        {"id": conversation["id"]},
        {"$set": {"last_message": message.content, "last_message_time": datetime.utcnow()}}
    )
    
    return msg.dict()

@api_router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"participants": current_user["id"]}
    ).sort("last_message_time", -1).to_list(50)
    
    enriched = []
    for conv in conversations:
        conv_data = {k: v for k, v in conv.items() if k != "_id"}
        
        other_id = [p for p in conv["participants"] if p != current_user["id"]][0]
        other_user = await db.users.find_one({"id": other_id})
        if other_user:
            conv_data["other_user"] = {
                "id": other_user["id"],
                "full_name": other_user["full_name"],
                "avatar": other_user.get("avatar")
            }
        
        unread = await db.messages.count_documents({
            "conversation_id": conv["id"],
            "receiver_id": current_user["id"],
            "is_read": False
        })
        conv_data["unread_count"] = unread
        
        enriched.append(conv_data)
    
    return enriched

@api_router.get("/messages/{conversation_id}")
async def get_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation or current_user["id"] not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Get messages sorted by created_at ascending (oldest first, newest last)
    messages = await db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    
    await db.messages.update_many(
        {"conversation_id": conversation_id, "receiver_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    
    return [{k: v for k, v in m.items() if k != "_id"} for m in messages]

@api_router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    message = await db.messages.find_one({"id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    if message["sender_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres messages")
    
    await db.messages.delete_one({"id": message_id})
    
    # Update conversation last message if needed
    conversation = await db.conversations.find_one({"id": message["conversation_id"]})
    if conversation:
        last_msg = await db.messages.find_one(
            {"conversation_id": message["conversation_id"]},
            sort=[("created_at", -1)]
        )
        if last_msg:
            await db.conversations.update_one(
                {"id": message["conversation_id"]},
                {"$set": {"last_message": last_msg["content"], "last_message_time": last_msg["created_at"]}}
            )
        else:
            # Auto-delete conversation when all messages are deleted
            await db.conversations.delete_one({"id": message["conversation_id"]})
    
    return {"message": "Message supprimé"}

@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    participants = conversation.get("participants", [])
    if current_user["id"] not in participants:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Delete all messages in the conversation
    await db.messages.delete_many({"conversation_id": conversation_id})
    # Delete the conversation itself
    await db.conversations.delete_one({"id": conversation_id})
    
    return {"message": "Conversation supprimée"}

# ==================== MEMBERSHIP ENDPOINTS ====================

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@api_router.post("/membership/join")
async def join_membership(current_user: dict = Depends(get_current_user)):
    existing = await db.memberships.find_one({"user_id": current_user["id"], "is_active": True})
    if existing:
        raise HTTPException(status_code=400, detail="Vous êtes déjà membre")
    
    # Count total active members
    total_members = await db.memberships.count_documents({"is_active": True})
    is_early_member = total_members < CLUB_MAX_MEMBERS
    
    benefits = []
    if is_early_member:
        benefits = [
            "Coupons de réduction personnalisables",
            "Accès prioritaire aux événements exclusifs",
            "Réductions sur les services",
            "Goodies exclusifs"
        ]
    
    membership = Membership(
        user_id=current_user["id"],
        member_number=total_members + 1,
        is_active=True,
        benefits=benefits,
        expires_at=datetime.utcnow() + timedelta(days=365)
    )
    
    await db.memberships.insert_one(membership.dict())
    
    result = membership.dict()
    result["is_early_member"] = is_early_member
    result["total_members"] = total_members + 1
    return result

@api_router.get("/membership/status")
async def get_membership_status(current_user: dict = Depends(get_current_user)):
    membership = await db.memberships.find_one(
        {"user_id": current_user["id"], "is_active": True}
    )
    total_members = await db.memberships.count_documents({"is_active": True})
    spots_left = max(0, CLUB_MAX_MEMBERS - total_members)
    
    if membership:
        membership.pop("_id", None)
        return {
            "is_member": True,
            "membership": membership,
            "is_early_member": membership.get("member_number", 99) <= CLUB_MAX_MEMBERS,
            "spots_left": spots_left,
            "total_members": total_members
        }
    return {
        "is_member": False,
        "membership": None,
        "spots_left": spots_left,
        "total_members": total_members
    }

# ==================== FAVORITES ENDPOINTS ====================

@api_router.post("/favorites/{freelancer_id}")
async def add_favorite(freelancer_id: str, current_user: dict = Depends(get_current_user)):
    # Prevent self-like
    if freelancer_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas aimer votre propre profil")
    
    existing = await db.favorites.find_one({
        "user_id": current_user["id"],
        "freelancer_id": freelancer_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Déjà dans les favoris")
    
    favorite = Favorite(user_id=current_user["id"], freelancer_id=freelancer_id)
    await db.favorites.insert_one(favorite.dict())
    return {"message": "Ajouté aux favoris"}

@api_router.delete("/favorites/{freelancer_id}")
async def remove_favorite(freelancer_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.favorites.delete_one({
        "user_id": current_user["id"],
        "freelancer_id": freelancer_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Non trouvé dans les favoris")
    return {"message": "Retiré des favoris"}

@api_router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": current_user["id"]}).to_list(100)
    
    freelancer_ids = [f["freelancer_id"] for f in favorites]
    freelancers = await db.users.find({"id": {"$in": freelancer_ids}}).to_list(100)
    
    return [{k: v for k, v in f.items() if k != "hashed_password" and k != "_id"} for f in freelancers]

# ==================== REVIEW ENDPOINTS ====================

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": review.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    
    if booking["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Seul le client peut laisser un avis")
    
    if booking["status"] != "completed":
        raise HTTPException(status_code=400, detail="Vous ne pouvez noter que les réservations terminées")
    
    existing = await db.reviews.find_one({"booking_id": review.booking_id})
    if existing:
        raise HTTPException(status_code=400, detail="Avis déjà laissé")
    
    review_obj = Review(
        booking_id=review.booking_id,
        reviewer_id=current_user["id"],
        freelancer_id=booking["freelancer_id"],
        rating=review.rating,
        comment=review.comment
    )
    
    await db.reviews.insert_one(review_obj.dict())
    
    reviews = await db.reviews.find({"freelancer_id": booking["freelancer_id"]}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await db.users.update_one(
        {"id": booking["freelancer_id"]},
        {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
    )
    
    return review_obj.dict()

@api_router.get("/reviews/{freelancer_id}")
async def get_reviews(freelancer_id: str, limit: int = 20, skip: int = 0):
    """Get reviews for a freelancer"""
    reviews = await db.reviews.find(
        {"freelancer_id": freelancer_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with reviewer info
    enriched = []
    for r in reviews:
        reviewer = await db.users.find_one({"id": r["reviewer_id"]})
        review_data = {k: v for k, v in r.items() if k != "_id"}
        review_data["reviewer_name"] = reviewer["full_name"] if reviewer else "Utilisateur"
        review_data["reviewer_avatar"] = reviewer.get("avatar") if reviewer else None
        enriched.append(review_data)
    
    return enriched

@api_router.post("/reviews/direct")
async def create_direct_review(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a review directly on a provider (without booking requirement)"""
    freelancer_id = data.get("freelancer_id")
    rating = data.get("rating", 5)
    comment = data.get("comment", "")
    
    if not freelancer_id:
        raise HTTPException(status_code=400, detail="freelancer_id requis")
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="La note doit être entre 1 et 5")
    
    freelancer = await db.users.find_one({"id": freelancer_id})
    if not freelancer:
        raise HTTPException(status_code=404, detail="Prestataire non trouvé")
    
    if current_user["id"] == freelancer_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous auto-évaluer")
    
    review_obj = Review(
        booking_id="direct",
        reviewer_id=current_user["id"],
        freelancer_id=freelancer_id,
        rating=rating,
        comment=comment
    )
    
    await db.reviews.insert_one(review_obj.dict())
    
    # Update freelancer rating
    all_reviews = await db.reviews.find({"freelancer_id": freelancer_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.users.update_one(
        {"id": freelancer_id},
        {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(all_reviews)}}
    )
    
    return review_obj.dict()

# ==================== MOCKED STRIPE ENDPOINTS ====================

@api_router.post("/membership/create-checkout-session")
async def create_checkout_session(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Mocked Stripe checkout session for membership"""
    plan_type = data.get("plan", "membership")
    
    # Simulate creating a Stripe checkout session
    session_id = f"cs_mock_{str(uuid.uuid4())[:8]}"
    
    return {
        "session_id": session_id,
        "url": f"https://checkout.stripe.com/mock/{session_id}",
        "status": "created",
        "plan": plan_type,
        "amount": 6000,  # 60€ in cents
        "currency": "eur",
        "mock": True
    }

@api_router.post("/membership/confirm-payment")
async def confirm_mock_payment(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Mock payment confirmation — simulates successful Stripe webhook"""
    session_id = data.get("session_id", "")
    
    # Check current membership
    existing = await db.memberships.find_one({"user_id": current_user["id"]})
    
    member_count = await db.memberships.count_documents({})
    member_number = member_count + 1
    
    if existing:
        await db.memberships.update_one(
            {"user_id": current_user["id"]},
            {"$set": {
                "is_active": True,
                "started_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat(),
                "payment_id": session_id
            }}
        )
    else:
        membership = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "is_active": True,
            "member_number": member_number,
            "benefits": ["coupons", "events", "discounts", "goodies"],
            "started_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "payment_id": session_id
        }
        await db.memberships.insert_one(membership)
    
    # Update user profile
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"is_harmoo_club": True, "membership_status": "active"}}
    )
    
    return {
        "status": "success",
        "member_number": existing.get("member_number", member_number) if existing else member_number,
        "message": "Bienvenue dans le Harmoo Club !"
    }

@api_router.get("/membership/status-v2")
async def get_membership_status_v2(current_user: dict = Depends(get_current_user)):
    """Get membership status for current user"""
    membership = await db.memberships.find_one({"user_id": current_user["id"]})
    total_members = await db.memberships.count_documents({"is_active": True})
    spots_left = max(0, CLUB_MAX_MEMBERS - total_members)
    
    return {
        "is_member": membership is not None and membership.get("is_active", False),
        "membership": {k: v for k, v in membership.items() if k != "_id"} if membership else None,
        "spots_left": spots_left,
        "total_spots": CLUB_MAX_MEMBERS,
        "total_members": total_members
    }

@api_router.post("/stripe-webhook")
async def stripe_webhook(data: dict):
    """Mocked Stripe webhook handler"""
    event_type = data.get("type", "checkout.session.completed")
    
    if event_type == "checkout.session.completed":
        user_id = data.get("user_id")
        if user_id:
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"is_harmoo_club": True, "membership_status": "active"}}
            )
    
    return {"received": True}

# ==================== OPEN CONVERSATION WITHOUT AUTO-MESSAGE ====================

@api_router.post("/conversations/open")
async def open_conversation(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create or get an existing conversation without sending any message"""
    receiver_id = data.get("receiver_id")
    if not receiver_id:
        raise HTTPException(status_code=400, detail="receiver_id requis")
    
    receiver = await db.users.find_one({"id": receiver_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    participants = sorted([current_user["id"], receiver_id])
    conversation = await db.conversations.find_one({"participants": participants})
    
    if not conversation:
        conversation = Conversation(participants=participants)
        await db.conversations.insert_one(conversation.dict())
        conversation = conversation.dict()
    else:
        conversation = {k: v for k, v in conversation.items() if k != "_id"}
    
    conversation["other_user"] = {
        "id": receiver["id"],
        "full_name": receiver["full_name"],
        "avatar": receiver.get("avatar")
    }
    
    return conversation

# ==================== PROFILE SLUG / SHAREABLE LINK ====================

def generate_slug(full_name: str) -> str:
    """Generate a URL-safe slug from a name"""
    import re
    import unicodedata
    # Normalize unicode characters
    slug = unicodedata.normalize('NFKD', full_name.lower())
    slug = slug.encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug.strip())
    slug = re.sub(r'-+', '-', slug)
    return slug

@api_router.get("/p/{slug}")
async def get_profile_by_slug(slug: str):
    """Get a freelancer profile by their unique slug (shareable link)"""
    user = await db.users.find_one({"profile_slug": slug})
    if not user:
        # Try to find by partial match
        user = await db.users.find_one({"profile_slug": {"$regex": f"^{slug}"}})
    if not user:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    
    user_data = {k: v for k, v in user.items() if k not in ["hashed_password", "_id", "is_seed"]}
    
    # Enrich with services
    services = await db.services.find({"freelancer_id": user["id"], "is_active": True}).to_list(20)
    user_data["services"] = [{k: v for k, v in s.items() if k != "_id"} for s in services]
    
    # Portfolio
    portfolio = await db.portfolio.find({"user_id": user["id"]}).sort("created_at", -1).to_list(20)
    user_data["portfolio"] = [{k: v for k, v in p.items() if k != "_id"} for p in portfolio]
    
    return user_data

# ==================== CATEGORIES ENDPOINT ====================

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES_DATA}

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "freelancer":
        raise HTTPException(status_code=403, detail="Freelance uniquement")
    
    payments = await db.payments.find({"freelancer_id": current_user["id"]}).to_list(1000)
    total_earnings = sum(p["freelancer_amount"] for p in payments)
    
    total_bookings = await db.bookings.count_documents({"freelancer_id": current_user["id"]})
    completed_bookings = await db.bookings.count_documents({
        "freelancer_id": current_user["id"],
        "status": "completed"
    })
    pending_bookings = await db.bookings.count_documents({
        "freelancer_id": current_user["id"],
        "status": "pending"
    })
    
    # Service limit info
    tier = current_user.get("subscription_tier", "essentiel")
    max_services = SERVICE_LIMITS.get(tier, 1)
    current_services = await db.services.count_documents({"freelancer_id": current_user["id"], "is_active": True})
    
    profile_views = total_bookings * 10
    
    return {
        "total_earnings": total_earnings,
        "total_bookings": total_bookings,
        "completed_bookings": completed_bookings,
        "pending_bookings": pending_bookings,
        "profile_views": profile_views,
        "rating": current_user.get("rating", 0),
        "reviews_count": current_user.get("reviews_count", 0),
        "subscription_tier": tier,
        "max_services": max_services,
        "current_services": current_services
    }

# ==================== SEED DATA ENDPOINT ====================

@api_router.post("/seed/harmoo-club")
async def seed_harmoo_club():
    """Create Harmoo Club admin account with services"""
    
    # Check if already exists
    existing = await db.users.find_one({"email": "admin@harmoo.fr"})
    if existing:
        return {"message": "Harmoo Club already exists", "id": existing["id"]}
    
    # Create Harmoo Club account
    harmoo_club = UserProfile(
        email="admin@harmoo.fr",
        full_name="Harmoo Club",
        user_type="freelancer",
        bio="Le compte officiel Harmoo Club. Services premium pour les créatifs.",
        city="Paris",
        location={"lat": 48.8566, "lng": 2.3522},
        categories=["music", "video"],
        subcategories=["studio d'enregistrement", "ingénieur du son"],
        is_harmoo_club=True,
        subscription_tier="business",
        rating=5.0,
        reviews_count=50,
        is_available=True,
        is_provider_mode=True
    )
    
    harmoo_dict = harmoo_club.dict()
    harmoo_dict["hashed_password"] = get_password_hash("HarmooAdmin2025!")
    harmoo_dict["is_seed"] = True
    await db.users.insert_one(harmoo_dict)
    
    # Create services
    services = [
        {
            "title": "Session Podcast",
            "description": "Enregistrez votre podcast dans notre studio professionnel avec un ingénieur du son dédié.",
            "category": "music",
            "subcategory": "studio d'enregistrement",
            "price": 100,
            "price_unit": "hourly",
            "duration_hours": 1,
            "options": [
                {"id": str(uuid.uuid4()), "name": "Montage", "price": 100, "description": "Montage et édition professionnelle"},
                {"id": str(uuid.uuid4()), "name": "Maquillage", "price": 80, "description": "Maquillage professionnel pour la vidéo"}
            ]
        },
        {
            "title": "Session Studio",
            "description": "Session d'enregistrement en studio avec matériel haut de gamme.",
            "category": "music",
            "subcategory": "studio d'enregistrement",
            "price": 35,
            "price_unit": "hourly",
            "duration_hours": 1,
            "options": [
                {"id": str(uuid.uuid4()), "name": "Mix", "price": 80, "description": "Mixage professionnel"},
                {"id": str(uuid.uuid4()), "name": "Mastering", "price": 60, "description": "Mastering haute qualité"}
            ]
        },
        {
            "title": "Accompagnement",
            "description": "Accompagnement personnalisé pour développer votre projet créatif.",
            "category": "music",
            "subcategory": "label/producteur",
            "price": 150,
            "price_unit": "fixed",
            "duration_hours": 2,
            "options": []
        }
    ]
    
    for service_data in services:
        service = Service(
            freelancer_id=harmoo_club.id,
            **service_data
        )
        await db.services.insert_one(service.dict())
    
    return {"message": "Harmoo Club created", "id": harmoo_club.id}

@api_router.post("/seed/fake-profiles")
async def seed_fake_profiles():
    """Generate fake freelancer profiles"""
    
    # French cities with coordinates
    cities = [
        {"name": "Le Mans", "lat": 47.9960, "lng": 0.1933},
        {"name": "Bordeaux", "lat": 44.8378, "lng": -0.5792},
        {"name": "Lille", "lat": 50.6292, "lng": 3.0573},
        {"name": "Nantes", "lat": 47.2184, "lng": -1.5536},
        {"name": "Angers", "lat": 47.4784, "lng": -0.5632},
        {"name": "Montpellier", "lat": 43.6108, "lng": 3.8767},
        {"name": "Clermont-Ferrand", "lat": 45.7772, "lng": 3.0870},
        {"name": "Laval", "lat": 48.0693, "lng": -0.7729},
        {"name": "Lyon", "lat": 45.7640, "lng": 4.8357},
        {"name": "Toulouse", "lat": 43.6047, "lng": 1.4442},
        {"name": "Nice", "lat": 43.7102, "lng": 7.2620},
        {"name": "Strasbourg", "lat": 48.5734, "lng": 7.7521},
        {"name": "Rennes", "lat": 48.1173, "lng": -1.6778},
        {"name": "Reims", "lat": 49.2583, "lng": 4.0317},
        {"name": "Tours", "lat": 47.3941, "lng": 0.6848},
        {"name": "Dijon", "lat": 47.3220, "lng": 5.0415},
        {"name": "Grenoble", "lat": 45.1885, "lng": 5.7245},
        {"name": "Rouen", "lat": 49.4432, "lng": 1.0993},
        {"name": "Orléans", "lat": 47.9029, "lng": 1.9039},
        {"name": "Caen", "lat": 49.1829, "lng": -0.3707},
    ]
    
    # French first and last names
    first_names = ["Lucas", "Emma", "Gabriel", "Jade", "Louis", "Louise", "Raphaël", "Alice", "Jules", "Chloé",
                   "Adam", "Léa", "Arthur", "Manon", "Hugo", "Inès", "Nathan", "Lina", "Tom", "Rose",
                   "Théo", "Anna", "Noah", "Juliette", "Ethan", "Lou", "Mathis", "Léonie", "Léo", "Eva"]
    last_names = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau",
                  "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier"]
    
    created_profiles = []
    city_index = 0
    
    for category_id, category_data in CATEGORIES_DATA.items():
        for i in range(3):
            # Determine subscription tier (30% free, 40% standard, 30% business)
            import random
            tier_rand = random.random()
            if tier_rand < 0.3:
                tier = "essentiel"
                max_services = 1
            elif tier_rand < 0.7:
                tier = "standard"
                max_services = 2
            else:
                tier = "business"
                max_services = 3
            
            city = cities[city_index % len(cities)]
            city_index += 1
            
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            full_name = f"{first_name} {last_name}"
            
            # Pick random subcategory
            subcategory = random.choice(category_data["subcategories"])
            
            # Check if profile already exists
            email = f"{first_name.lower()}.{last_name.lower()}.{category_id}@harmoo-demo.fr"
            existing = await db.users.find_one({"email": email})
            if existing:
                continue
            
            profile = UserProfile(
                email=email,
                full_name=full_name,
                user_type="freelancer",
                bio=f"Professionnel(le) {subcategory} basé(e) à {city['name']}. Passionné(e) par mon métier depuis plus de 5 ans.",
                city=city["name"],
                location={"lat": city["lat"] + random.uniform(-0.1, 0.1), "lng": city["lng"] + random.uniform(-0.1, 0.1)},
                categories=[category_id],
                subcategories=[subcategory],
                hourly_rate=random.randint(25, 150),
                subscription_tier=tier,
                rating=round(random.uniform(3.5, 5.0), 1),
                reviews_count=random.randint(1, 50),
                is_available=True,
                is_provider_mode=True
            )
            
            profile_dict = profile.dict()
            profile_dict["hashed_password"] = get_password_hash("Demo2025!")
            profile_dict["is_seed"] = True
            await db.users.insert_one(profile_dict)
            
            # Create services for this profile
            num_services = min(random.randint(1, 2), max_services)
            for j in range(num_services):
                service_titles = {
                    "music": ["Session studio", "Composition musicale", "Production audio"],
                    "video": ["Réalisation vidéo", "Montage professionnel", "Captation événement"],
                    "photo": ["Séance photo portrait", "Reportage photo", "Shooting mode"],
                    "design": ["Création logo", "Identité visuelle", "Design print"],
                    "fashion": ["Création sur mesure", "Conseil en image", "Stylisme événement"],
                    "event": ["Organisation événement", "Décoration", "Animation"],
                    "architecture": ["Design d'intérieur", "Plans et esquisses", "Aménagement"],
                    "writing": ["Rédaction contenu", "Correction textes", "Scénario"],
                    "content": ["Gestion réseaux sociaux", "Création de contenu", "Stratégie digitale"],
                    "artisanal": ["Création sur mesure", "Pièce artisanale unique", "Collection capsule"]
                }
                
                title = random.choice(service_titles.get(category_id, ["Service professionnel"]))
                price = random.randint(50, 300)
                
                service = Service(
                    freelancer_id=profile.id,
                    title=title,
                    description=f"Service professionnel de {subcategory}. Qualité garantie et satisfaction client.",
                    category=category_id,
                    subcategory=subcategory,
                    price=price,
                    price_unit=random.choice(["fixed", "hourly"]),
                    duration_hours=random.randint(1, 4),
                    options=[
                        {"id": str(uuid.uuid4()), "name": "Option express", "price": round(price * 0.3), "description": "Livraison rapide"},
                        {"id": str(uuid.uuid4()), "name": "Option premium", "price": round(price * 0.5), "description": "Service premium"}
                    ]
                )
                await db.services.insert_one(service.dict())
            
            created_profiles.append({"name": full_name, "city": city["name"], "category": category_id, "tier": tier})
    
    return {"message": f"Created {len(created_profiles)} profiles", "profiles": created_profiles}

# ==================== STATUS CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Harmoo Marketplace API", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression for all responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

@app.on_event("startup")
async def mark_seeded_profiles():
    """Delete all fake/demo/test accounts — keep only real users"""
    fake_patterns = ["@harmoo-demo.fr", "@harmoo.com", "@harmoo-test.com", "@test.com"]
    for pattern in fake_patterns:
        result = await db.users.delete_many({"email": {"$regex": f"{pattern.replace('.', '[.]')}$"}})
        if result.deleted_count > 0:
            logger.info(f"Deleted {result.deleted_count} fake accounts matching {pattern}")
    
    # Generate profile slugs for users who don't have one
    users_without_slug = await db.users.find({"profile_slug": {"$exists": False}}).to_list(1000)
    for u in users_without_slug:
        base_slug = generate_slug(u.get("full_name", "user"))
        slug = base_slug
        counter = 1
        while await db.users.find_one({"profile_slug": slug, "id": {"$ne": u["id"]}}):
            slug = f"{base_slug}-{counter}"
            counter += 1
        await db.users.update_one({"id": u["id"]}, {"$set": {"profile_slug": slug}})

# ==================== ADMIN: PASSWORD RESET (TEMP) ====================
@api_router.post("/admin/reset-password")
async def admin_reset_password(data: dict):
    """Temporary admin endpoint to reset user password"""
    admin_key = data.get("admin_key")
    if admin_key != "harmoo-admin-2025":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    email = data.get("email")
    new_password = data.get("new_password")
    
    user = await db.users.find_one({"email": email})
    if not user:
        return {"error": f"User {email} not found"}
    
    hashed = get_password_hash(new_password)
    await db.users.update_one({"id": user["id"]}, {"$set": {"hashed_password": hashed}})
    return {"success": True, "message": f"Password reset for {email}"}

@api_router.get("/admin/list-users")
async def admin_list_users(admin_key: str = ""):
    """Temporary admin endpoint to list all users"""
    if admin_key != "harmoo-admin-2025":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    users = await db.users.find({}, {"full_name": 1, "email": 1, "is_harmoo_club": 1, "_id": 0}).to_list(100)
    return {"users": users, "total": len(users)}



@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Create MongoDB indexes on startup for performance
@app.on_event("startup")
async def create_indexes():
    try:
        await db.users.create_index("id", unique=True)
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_type")
        await db.users.create_index("categories")
        await db.users.create_index("is_available")
        await db.users.create_index("profile_slug")
        await db.bookings.create_index("client_id")
        await db.bookings.create_index("freelancer_id")
        await db.conversations.create_index("participants")
        logger.info("MongoDB indexes created")
    except Exception as e:
        logger.warning(f"Index creation: {e}")
