#!/usr/bin/env python3
"""
Backend API Testing for Bank Details (RIB) Endpoints
Tests the critical flow for bank details API after route conflict fix
"""

import requests
import json
import sys
from typing import Dict, Any, Optional
from datetime import datetime

# Base URL for the API
BASE_URL = "https://april-8-launch.preview.emergentagent.com/api"

# Test credentials for bank details testing
TEST_CREDENTIALS = {
    "client": {"email": "test@test.com", "password": "test123"},
    "freelancer": {"email": "couturier@test.com", "password": "test123"},
    "rib_test": {"email": "ribtest@test.com", "password": "test123", "full_name": "RIB Test User"}
}

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.user_ids = {}
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{BASE_URL}{endpoint}"
        req_headers = headers or {}
        
        if token:
            req_headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=req_headers, timeout=30)
            elif method.upper() == "POST":
                req_headers["Content-Type"] = "application/json"
                response = self.session.post(url, json=data, headers=req_headers, timeout=30)
            elif method.upper() == "PUT":
                req_headers["Content-Type"] = "application/json"
                response = self.session.put(url, json=data, headers=req_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=req_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def login_user(self, user_type: str) -> bool:
        """Login user and store token"""
        try:
            credentials = TEST_CREDENTIALS[user_type]
            response = self.make_request("POST", "/auth/login", credentials)
            
            if response.status_code == 200:
                data = response.json()
                self.tokens[user_type] = data["access_token"]
                self.user_ids[user_type] = data["user"]["id"]
                self.log_result(f"Login {user_type}", True, f"Successfully logged in as {credentials['email']}")
                return True
            else:
                self.log_result(f"Login {user_type}", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result(f"Login {user_type}", False, f"Login error: {str(e)}")
            return False
    
    def test_self_like_prevention(self):
        """Test 1: Self-like prevention"""
        if not self.login_user("freelancer"):
            return
        
        try:
            user_id = self.user_ids["freelancer"]
            token = self.tokens["freelancer"]
            
            # Try to like own profile
            response = self.make_request("POST", f"/favorites/{user_id}", token=token)
            
            if response.status_code == 400:
                self.log_result("Self-like prevention", True, "Correctly blocked self-like with 400 error")
            else:
                self.log_result("Self-like prevention", False, f"Expected 400, got {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Self-like prevention", False, f"Test error: {str(e)}")
    
    def test_spectacle_vivant_category(self):
        """Test 2: New spectacle_vivant category"""
        try:
            response = self.make_request("GET", "/categories")
            
            if response.status_code == 200:
                data = response.json()
                categories = data.get("categories", {})
                
                if "spectacle_vivant" in categories:
                    spectacle_data = categories["spectacle_vivant"]
                    expected_subcats = ["danseur", "stand-uppeur", "comédien"]
                    actual_subcats = spectacle_data.get("subcategories", [])
                    
                    missing_subcats = [sub for sub in expected_subcats if sub not in actual_subcats]
                    
                    if not missing_subcats:
                        self.log_result("Spectacle vivant category", True, f"Category exists with expected subcategories: {actual_subcats}")
                    else:
                        self.log_result("Spectacle vivant category", False, f"Missing subcategories: {missing_subcats}")
                else:
                    self.log_result("Spectacle vivant category", False, "spectacle_vivant category not found", list(categories.keys()))
            else:
                self.log_result("Spectacle vivant category", False, f"Categories endpoint failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Spectacle vivant category", False, f"Test error: {str(e)}")
    
    def test_conversation_open_without_auto_message(self):
        """Test 3: Conversation open without auto-message"""
        if not self.login_user("client"):
            return
        
        try:
            # First get a freelancer ID
            response = self.make_request("GET", "/freelancers?limit=1")
            if response.status_code != 200:
                self.log_result("Conversation open", False, "Could not get freelancers list", response.text)
                return
            
            freelancers = response.json()
            if not freelancers:
                self.log_result("Conversation open", False, "No freelancers found")
                return
            
            freelancer_id = freelancers[0]["id"]
            token = self.tokens["client"]
            
            # Open conversation
            response = self.make_request("POST", "/conversations/open", 
                                       {"receiver_id": freelancer_id}, token=token)
            
            if response.status_code == 200:
                conversation = response.json()
                conversation_id = conversation["id"]
                
                # Check if conversation was created without messages
                response = self.make_request("GET", f"/messages/{conversation_id}", token=token)
                
                if response.status_code == 200:
                    messages = response.json()
                    if len(messages) == 0:
                        self.log_result("Conversation open", True, "Conversation created without auto-message")
                    else:
                        self.log_result("Conversation open", False, f"Conversation has {len(messages)} messages, expected 0")
                else:
                    self.log_result("Conversation open", False, f"Could not get messages: {response.status_code}")
            else:
                self.log_result("Conversation open", False, f"Conversation creation failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Conversation open", False, f"Test error: {str(e)}")
    
    def test_profile_slug_shareable_link(self):
        """Test 4: Profile slug / shareable link"""
        try:
            # Register a new user
            user_data = {
                "email": "slugtest@test.com",
                "password": "test123",
                "full_name": "Slug Test User",
                "user_type": "freelancer",
                "categories": ["spectacle_vivant"],
                "subcategories": ["danseur"]
            }
            
            response = self.make_request("POST", "/auth/register", user_data)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                profile_slug = user.get("profile_slug")
                
                if profile_slug:
                    # Test the shareable link
                    response = self.make_request("GET", f"/p/{profile_slug}")
                    
                    if response.status_code == 200:
                        profile_data = response.json()
                        if profile_data.get("full_name") == "Slug Test User":
                            self.log_result("Profile slug", True, f"Profile accessible via slug: {profile_slug}")
                        else:
                            self.log_result("Profile slug", False, "Profile data mismatch")
                    else:
                        self.log_result("Profile slug", False, f"Profile not accessible via slug: {response.status_code}")
                else:
                    self.log_result("Profile slug", False, "No profile_slug in registration response", user)
            else:
                self.log_result("Profile slug", False, f"Registration failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Profile slug", False, f"Test error: {str(e)}")
    
    def test_exclude_own_profile_from_feed(self):
        """Test 5: Exclude own profile from feed"""
        if not self.login_user("freelancer"):
            return
        
        try:
            user_id = self.user_ids["freelancer"]
            token = self.tokens["freelancer"]
            
            # Get freelancers with exclude_user_id
            response = self.make_request("GET", f"/freelancers?exclude_user_id={user_id}", token=token)
            
            if response.status_code == 200:
                freelancers = response.json()
                user_ids_in_response = [f["id"] for f in freelancers]
                
                if user_id not in user_ids_in_response:
                    self.log_result("Exclude own profile", True, f"Own profile correctly excluded from {len(freelancers)} results")
                else:
                    self.log_result("Exclude own profile", False, "Own profile found in results")
            else:
                self.log_result("Exclude own profile", False, f"Freelancers endpoint failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Exclude own profile", False, f"Test error: {str(e)}")
    
    def test_no_seeded_accounts(self):
        """Test 6: No seeded accounts"""
        try:
            response = self.make_request("GET", "/freelancers?limit=100")
            
            if response.status_code == 200:
                freelancers = response.json()
                demo_emails = [f["email"] for f in freelancers if "@harmoo-demo.fr" in f["email"]]
                
                if not demo_emails:
                    self.log_result("No seeded accounts", True, f"No @harmoo-demo.fr emails found in {len(freelancers)} freelancers")
                else:
                    self.log_result("No seeded accounts", False, f"Found {len(demo_emails)} demo emails", demo_emails[:5])
            else:
                self.log_result("No seeded accounts", False, f"Freelancers endpoint failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("No seeded accounts", False, f"Test error: {str(e)}")
    
    def test_commission_rates(self):
        """Test 7: Commission rates"""
        try:
            response = self.make_request("GET", "/subscriptions/plans")
            
            if response.status_code == 200:
                plans = response.json()
                
                expected_commissions = {
                    "essentiel": 15,
                    "standard": 6,
                    "business": 0
                }
                
                all_correct = True
                for plan_name, expected_commission in expected_commissions.items():
                    if plan_name in plans:
                        actual_commission = plans[plan_name].get("commission")
                        if actual_commission != expected_commission:
                            self.log_result("Commission rates", False, 
                                          f"{plan_name}: expected {expected_commission}%, got {actual_commission}%")
                            all_correct = False
                    else:
                        self.log_result("Commission rates", False, f"Plan {plan_name} not found")
                        all_correct = False
                
                if all_correct:
                    self.log_result("Commission rates", True, "All commission rates correct: essentiel 15%, standard 6%, business 0%")
            else:
                self.log_result("Commission rates", False, f"Subscription plans endpoint failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Commission rates", False, f"Test error: {str(e)}")
    
    def test_portfolio_with_media_links(self):
        """Test 8: Portfolio with media links"""
        if not self.login_user("freelancer"):
            return
        
        try:
            token = self.tokens["freelancer"]
            
            # Create portfolio item with media links
            portfolio_data = {
                "title": "Test Project",
                "description": "desc",
                "category": "fashion",
                "youtube_url": "https://youtube.com/test",
                "instagram_url": "https://instagram.com/test"
            }
            
            response = self.make_request("POST", "/portfolio", portfolio_data, token=token)
            
            if response.status_code == 200:
                # Get portfolio to verify media links
                response = self.make_request("GET", "/portfolio", token=token)
                
                if response.status_code == 200:
                    portfolio_items = response.json()
                    test_item = None
                    
                    for item in portfolio_items:
                        if item.get("title") == "Test Project":
                            test_item = item
                            break
                    
                    if test_item:
                        youtube_url = test_item.get("youtube_url")
                        instagram_url = test_item.get("instagram_url")
                        
                        if youtube_url == "https://youtube.com/test" and instagram_url == "https://instagram.com/test":
                            self.log_result("Portfolio media links", True, "Portfolio item created with media links")
                        else:
                            self.log_result("Portfolio media links", False, 
                                          f"Media links mismatch: youtube={youtube_url}, instagram={instagram_url}")
                    else:
                        self.log_result("Portfolio media links", False, "Test portfolio item not found")
                else:
                    self.log_result("Portfolio media links", False, f"Could not get portfolio: {response.status_code}")
            else:
                self.log_result("Portfolio media links", False, f"Portfolio creation failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Portfolio media links", False, f"Test error: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Harmoo Marketplace Backend API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Run all tests
        self.test_self_like_prevention()
        self.test_spectacle_vivant_category()
        self.test_conversation_open_without_auto_message()
        self.test_profile_slug_shareable_link()
        self.test_exclude_own_profile_from_feed()
        self.test_no_seeded_accounts()
        self.test_commission_rates()
        self.test_portfolio_with_media_links()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
    import os
import uvicorn

if __name__ == "__main__":
    uvicorn.run("backend_test:app", host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
