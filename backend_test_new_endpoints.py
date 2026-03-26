#!/usr/bin/env python3

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime, timedelta

# Base URL for the API
BASE_URL = "https://april-8-launch.preview.emergentagent.com/api"

class HarmooNewEndpointsTester:
    def __init__(self):
        self.session = None
        self.user1_token = None
        self.user2_token = None
        self.user1_data = None
        self.user2_data = None
        
    async def setup_session(self):
        """Setup aiohttp session"""
        connector = aiohttp.TCPConnector(ssl=False)
        self.session = aiohttp.ClientSession(connector=connector)
        
    async def cleanup_session(self):
        """Cleanup aiohttp session"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method, endpoint, data=None, headers=None, token=None):
        """Make HTTP request with proper error handling"""
        url = f"{BASE_URL}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if headers:
            request_headers.update(headers)
            
        if token:
            request_headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=request_headers) as response:
                    response_data = await response.text()
                    try:
                        response_json = json.loads(response_data) if response_data else {}
                    except json.JSONDecodeError:
                        response_json = {"raw_response": response_data}
                    return response.status, response_json
                    
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, headers=request_headers) as response:
                    response_data = await response.text()
                    try:
                        response_json = json.loads(response_data) if response_data else {}
                    except json.JSONDecodeError:
                        response_json = {"raw_response": response_data}
                    return response.status, response_json
                    
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, headers=request_headers) as response:
                    response_data = await response.text()
                    try:
                        response_json = json.loads(response_data) if response_data else {}
                    except json.JSONDecodeError:
                        response_json = {"raw_response": response_data}
                    return response.status, response_json
                    
            elif method.upper() == "DELETE":
                async with self.session.delete(url, headers=request_headers) as response:
                    response_data = await response.text()
                    try:
                        response_json = json.loads(response_data) if response_data else {}
                    except json.JSONDecodeError:
                        response_json = {"raw_response": response_data}
                    return response.status, response_json
                    
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None, {"error": str(e)}
            
    async def setup_test_users(self):
        """Setup two test users for conversation testing"""
        print("\n🔧 Setting up two test users for conversation tests...")
        
        # Create user 1
        user1_data = {
            "email": f"user1_{uuid.uuid4().hex[:8]}@harmoo.com",
            "password": "TestUser123!",
            "full_name": "Alice Testeur", 
            "user_type": "client"
        }
        
        status, response = await self.make_request("POST", "/auth/register", user1_data)
        if status in [200, 201]:
            self.user1_token = response.get("access_token") or response.get("token")
            self.user1_data = response.get("user", {})
            print(f"✅ User 1 registered: {user1_data['email']}")
        else:
            print(f"❌ User 1 registration failed: {status} - {response}")
            return False
            
        # Create user 2 
        user2_data = {
            "email": f"user2_{uuid.uuid4().hex[:8]}@harmoo.com", 
            "password": "TestUser123!",
            "full_name": "Bob Testeur",
            "user_type": "freelancer"
        }
        
        status, response = await self.make_request("POST", "/auth/register", user2_data)
        if status in [200, 201]:
            self.user2_token = response.get("access_token") or response.get("token")
            self.user2_data = response.get("user", {})
            print(f"✅ User 2 registered: {user2_data['email']}")
        else:
            print(f"❌ User 2 registration failed: {status} - {response}")
            return False
            
        return True
        
    async def test_subscription_plans(self):
        """Test GET /api/subscriptions/plans endpoint"""
        print("\n🧪 Testing GET /api/subscriptions/plans...")
        
        status, response = await self.make_request("GET", "/subscriptions/plans")
        
        if status == 200:
            expected_plans = ["essentiel", "standard", "business"]
            
            if not isinstance(response, dict):
                print(f"❌ Expected dict response, got: {type(response)}")
                return False
                
            # Check if all 3 plans are present
            found_plans = list(response.keys())
            if set(expected_plans).issubset(set(found_plans)):
                print("✅ All 3 subscription plans found")
                
                # Check pricing
                essentiel = response.get("essentiel", {})
                standard = response.get("standard", {})  
                business = response.get("business", {})
                
                if (essentiel.get("price") == 0 and 
                    standard.get("price") == 2.99 and 
                    business.get("price") == 7.99):
                    print("✅ Correct pricing for all plans")
                    return True
                else:
                    print(f"❌ Incorrect pricing - Essentiel: {essentiel.get('price')}, Standard: {standard.get('price')}, Business: {business.get('price')}")
                    return False
            else:
                print(f"❌ Missing plans. Found: {found_plans}, Expected: {expected_plans}")
                return False
        else:
            print(f"❌ Subscription plans request failed: {status} - {response}")
            return False
            
    async def test_membership_status_before_joining(self):
        """Test GET /api/membership/status before joining"""
        print("\n🧪 Testing GET /api/membership/status (before joining)...")
        
        status, response = await self.make_request("GET", "/membership/status", token=self.user1_token)
        
        if status == 200:
            if response.get("is_member") == False:
                print("✅ Correctly shows user is not a member")
                if "spots_left" in response and "total_members" in response:
                    print(f"✅ Status includes spots_left: {response['spots_left']}, total_members: {response['total_members']}")
                    return True
                else:
                    print(f"❌ Missing required fields in response: {response}")
                    return False
            else:
                print(f"❌ Expected is_member=False, got: {response.get('is_member')}")
                return False
        else:
            print(f"❌ Membership status request failed: {status} - {response}")
            return False
            
    async def test_membership_join(self):
        """Test POST /api/membership/join endpoint"""
        print("\n🧪 Testing POST /api/membership/join...")
        
        status, response = await self.make_request("POST", "/membership/join", token=self.user1_token)
        
        if status in [200, 201]:
            if "member_number" in response:
                member_number = response.get("member_number")
                print(f"✅ Successfully joined membership with member number: {member_number}")
                
                # Verify member number is returned and is positive
                if isinstance(member_number, int) and member_number > 0:
                    print("✅ Member number is valid")
                    return True
                else:
                    print(f"❌ Invalid member number: {member_number}")
                    return False
            else:
                print(f"❌ Member number not returned in response: {response}")
                return False
        else:
            print(f"❌ Membership join failed: {status} - {response}")
            return False
            
    async def test_membership_status_after_joining(self):
        """Test GET /api/membership/status after joining"""
        print("\n🧪 Testing GET /api/membership/status (after joining)...")
        
        status, response = await self.make_request("GET", "/membership/status", token=self.user1_token)
        
        if status == 200:
            if response.get("is_member") == True:
                print("✅ Correctly shows user is now a member")
                
                membership = response.get("membership", {})
                if membership and "member_number" in membership:
                    print(f"✅ Membership details include member number: {membership['member_number']}")
                    
                    # Check if is_early_member field exists
                    if "is_early_member" in response:
                        print(f"✅ Early member status: {response['is_early_member']}")
                    
                    return True
                else:
                    print(f"❌ Missing membership details: {response}")
                    return False
            else:
                print(f"❌ Expected is_member=True, got: {response.get('is_member')}")
                return False
        else:
            print(f"❌ Membership status request failed: {status} - {response}")
            return False
            
    async def test_conversation_deletion(self):
        """Test DELETE /api/conversations/{conversation_id} endpoint"""
        print("\n🧪 Testing DELETE /api/conversations/{conversation_id}...")
        
        # First send a message to create a conversation
        message_data = {
            "receiver_id": self.user2_data["id"],
            "content": "Bonjour! Message pour tester la suppression de conversation."
        }
        
        status, response = await self.make_request("POST", "/messages", message_data, token=self.user1_token)
        if status in [200, 201]:
            conversation_id = response.get("conversation_id")
            message_id = response.get("id")
            print(f"✅ Message sent, conversation created: {conversation_id}")
        else:
            print(f"❌ Failed to send initial message: {status} - {response}")
            return False
            
        # Send another message to the conversation
        message_data2 = {
            "receiver_id": self.user1_data["id"],
            "content": "Réponse au message de test."
        }
        
        status, response = await self.make_request("POST", "/messages", message_data2, token=self.user2_token)
        if status in [200, 201]:
            message_id2 = response.get("id")
            print("✅ Second message sent to conversation")
        else:
            print(f"❌ Failed to send second message: {status} - {response}")
            return False
            
        # Verify messages exist by getting conversations
        status, conversations = await self.make_request("GET", "/conversations", token=self.user1_token)
        if status == 200 and conversations:
            conversation_found = any(conv.get("id") == conversation_id for conv in conversations)
            if conversation_found:
                print("✅ Conversation exists with messages")
            else:
                print("❌ Conversation not found in user's conversations")
                return False
        else:
            print(f"❌ Failed to verify conversations: {status} - {conversations}")
            
        # Test 1: Delete the conversation as a participant
        status, response = await self.make_request("DELETE", f"/conversations/{conversation_id}", token=self.user1_token)
        if status == 200:
            print("✅ Conversation deleted successfully")
        else:
            print(f"❌ Conversation deletion failed: {status} - {response}")
            return False
            
        # Test 2: Verify conversation and messages are actually deleted
        # Check conversations list is empty or doesn't include the deleted one
        status, conversations = await self.make_request("GET", "/conversations", token=self.user1_token)
        if status == 200:
            if not conversations or not any(conv.get("id") == conversation_id for conv in conversations):
                print("✅ Conversation successfully removed from user's conversations")
            else:
                print("❌ Conversation still exists in user's conversations list")
                return False
        else:
            print(f"❌ Failed to verify conversation deletion: {status} - {conversations}")
            
        # Test 3: Try to delete the same conversation again (should return 404)
        status, response = await self.make_request("DELETE", f"/conversations/{conversation_id}", token=self.user1_token)
        if status == 404:
            print("✅ Deleting non-existent conversation correctly returns 404")
            return True
        else:
            print(f"❌ Expected 404 for deleted conversation, got: {status}")
            return False
            
    async def test_auto_delete_conversation(self):
        """Test auto-delete conversation when all messages are deleted"""
        print("\n🧪 Testing auto-delete conversation when all messages deleted...")
        
        # Create a conversation with a single message
        message_data = {
            "receiver_id": self.user2_data["id"],
            "content": "Message unique pour tester l'auto-suppression."
        }
        
        status, response = await self.make_request("POST", "/messages", message_data, token=self.user1_token)
        if status in [200, 201]:
            conversation_id = response.get("conversation_id")
            message_id = response.get("id")
            print(f"✅ Message sent, conversation created: {conversation_id}")
        else:
            print(f"❌ Failed to send message: {status} - {response}")
            return False
            
        # Verify conversation exists
        status, conversations = await self.make_request("GET", "/conversations", token=self.user1_token)
        conversation_found = False
        if status == 200 and conversations:
            conversation_found = any(conv.get("id") == conversation_id for conv in conversations)
            if conversation_found:
                print("✅ Conversation exists before message deletion")
            
        if not conversation_found:
            print("❌ Conversation not found before deletion test")
            return False
            
        # Delete the only message in the conversation
        status, response = await self.make_request("DELETE", f"/messages/{message_id}", token=self.user1_token)
        if status == 200:
            print("✅ Message deleted successfully")
        else:
            print(f"❌ Message deletion failed: {status} - {response}")
            return False
            
        # Wait a moment for auto-delete to process
        await asyncio.sleep(1)
            
        # Verify conversation was auto-deleted
        status, conversations = await self.make_request("GET", "/conversations", token=self.user1_token)
        if status == 200:
            if not conversations or not any(conv.get("id") == conversation_id for conv in conversations):
                print("✅ Conversation auto-deleted when last message was removed")
                return True
            else:
                print("❌ Conversation still exists after all messages deleted")
                return False
        else:
            print(f"❌ Failed to verify auto-delete: {status} - {conversations}")
            return False
            
    async def run_all_tests(self):
        """Run all tests for the NEW endpoints"""
        print("🚀 Starting Harmoo Marketplace NEW Endpoint Tests")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Setup test users
            if not await self.setup_test_users():
                print("❌ Failed to setup test users")
                return False
                
            # Run tests in order
            tests = [
                ("Subscription Plans", self.test_subscription_plans()),
                ("Membership Status (Before)", self.test_membership_status_before_joining()),
                ("Join Membership", self.test_membership_join()),
                ("Membership Status (After)", self.test_membership_status_after_joining()),
                ("Conversation Deletion", self.test_conversation_deletion()),
                ("Auto-delete Conversation", self.test_auto_delete_conversation()),
            ]
            
            results = []
            for test_name, test_coro in tests:
                print(f"\n{'='*60}")
                print(f"Running: {test_name}")
                print(f"{'='*60}")
                
                try:
                    result = await test_coro
                    results.append((test_name, result))
                except Exception as e:
                    print(f"❌ {test_name} failed with exception: {e}")
                    results.append((test_name, False))
                    
            # Print summary
            print(f"\n{'='*60}")
            print("🏁 TEST SUMMARY")
            print(f"{'='*60}")
            
            passed = 0
            total = len(results)
            
            for test_name, result in results:
                status = "✅ PASSED" if result else "❌ FAILED"
                print(f"{test_name}: {status}")
                if result:
                    passed += 1
                    
            print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
            
            return passed == total
            
        finally:
            await self.cleanup_session()

if __name__ == "__main__":
    tester = HarmooNewEndpointsTester()
    success = asyncio.run(tester.run_all_tests())
    exit(0 if success else 1)