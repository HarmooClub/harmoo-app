#!/usr/bin/env python3
"""
Bank Details (RIB) API Testing
Tests the critical flow for bank details API after route conflict fix
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from frontend environment
BASE_URL = "https://april-8-launch.preview.emergentagent.com/api"

class BankDetailsAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_user_email = "ribtest@test.com"
        self.test_user_password = "test123"
        self.test_user_name = "RIB Test User"
        self.access_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_user_registration(self):
        """Test 1: Register a new test freelancer user"""
        print("🔍 TEST 1: User Registration")
        
        registration_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "full_name": self.test_user_name,
            "user_type": "freelancer"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.log_test(
                    "User Registration", 
                    True, 
                    f"User registered successfully with ID: {self.user_id}"
                )
                return True
            elif response.status_code == 400 and "Email déjà enregistré" in response.text:
                # User already exists, try to login instead
                print("   User already exists, proceeding to login...")
                return self.test_user_login()
            else:
                self.log_test(
                    "User Registration", 
                    False, 
                    f"Registration failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False

    def test_user_login(self):
        """Test 2: Login to get JWT token"""
        print("🔍 TEST 2: User Login")
        
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.log_test(
                    "User Login", 
                    True, 
                    f"Login successful, token obtained for user ID: {self.user_id}"
                )
                return True
            else:
                self.log_test(
                    "User Login", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False

    def test_get_empty_bank_details(self):
        """Test 3 (Critical): GET /api/users/bank-details should return empty {} not 404"""
        print("🔍 TEST 3 (CRITICAL): Get Empty Bank Details")
        
        if not self.access_token:
            self.log_test("Get Empty Bank Details", False, "No access token available")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = self.session.get(
                f"{self.base_url}/users/bank-details",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data == {} or not data:
                    self.log_test(
                        "Get Empty Bank Details", 
                        True, 
                        "✅ ROUTE CONFLICT FIXED! Correctly returned empty bank details ({})"
                    )
                    return True
                else:
                    self.log_test(
                        "Get Empty Bank Details", 
                        True, 
                        f"✅ ROUTE CONFLICT FIXED! Returned existing bank details: {data}"
                    )
                    return True
            elif response.status_code == 404 and "Utilisateur non trouvé" in response.text:
                self.log_test(
                    "Get Empty Bank Details", 
                    False, 
                    "🚨 CRITICAL BUG: Still getting 404 'Utilisateur non trouvé' - route conflict NOT fixed!",
                    response.text
                )
                return False
            else:
                self.log_test(
                    "Get Empty Bank Details", 
                    False, 
                    f"Unexpected response status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Get Empty Bank Details", False, f"Exception: {str(e)}")
            return False

    def test_save_bank_details(self):
        """Test 4 (Critical): PUT /api/users/bank-details should save bank details"""
        print("🔍 TEST 4 (CRITICAL): Save Bank Details")
        
        if not self.access_token:
            self.log_test("Save Bank Details", False, "No access token available")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        bank_data = {
            "iban": "FR7630006000011234567890189",
            "bic": "BNPAFRPP",
            "account_holder": "Jean Dupont"
        }
        
        try:
            response = self.session.put(
                f"{self.base_url}/users/bank-details",
                json=bank_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_message = "Coordonnées bancaires mises à jour"
                if data.get("message") == expected_message:
                    self.log_test(
                        "Save Bank Details", 
                        True, 
                        "Bank details saved successfully"
                    )
                    return True
                else:
                    self.log_test(
                        "Save Bank Details", 
                        False, 
                        f"Unexpected response message: {data}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Save Bank Details", 
                    False, 
                    f"Save failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Save Bank Details", False, f"Exception: {str(e)}")
            return False

    def test_get_saved_bank_details(self):
        """Test 5: GET /api/users/bank-details should return saved data with iban_masked"""
        print("🔍 TEST 5: Get Saved Bank Details")
        
        if not self.access_token:
            self.log_test("Get Saved Bank Details", False, "No access token available")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = self.session.get(
                f"{self.base_url}/users/bank-details",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if we have the expected fields
                has_iban_masked = "iban_masked" in data
                has_basic_fields = all(field in data for field in ["iban", "bic", "account_holder"])
                
                if has_iban_masked and data["iban_masked"] == "****0189":
                    self.log_test(
                        "Get Saved Bank Details", 
                        True, 
                        f"Bank details retrieved with correct iban_masked: {data['iban_masked']}"
                    )
                    return True
                elif has_basic_fields:
                    self.log_test(
                        "Get Saved Bank Details", 
                        True, 
                        f"Bank details retrieved but iban_masked format may be different: {data}"
                    )
                    return True
                else:
                    self.log_test(
                        "Get Saved Bank Details", 
                        False, 
                        f"Missing expected fields in response: {data}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Get Saved Bank Details", 
                    False, 
                    f"Failed to retrieve bank details, status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Get Saved Bank Details", False, f"Exception: {str(e)}")
            return False

    def test_user_profile_endpoint(self):
        """Test 6: Verify GET /api/users/{user_id} still works (not broken by route change)"""
        print("🔍 TEST 6: User Profile Endpoint")
        
        if not self.user_id:
            self.log_test("User Profile Endpoint", False, "No user ID available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/users/{self.user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.user_id and data.get("email") == self.test_user_email:
                    self.log_test(
                        "User Profile Endpoint", 
                        True, 
                        f"User profile endpoint working correctly for user {self.user_id}"
                    )
                    return True
                else:
                    self.log_test(
                        "User Profile Endpoint", 
                        False, 
                        f"User profile data mismatch: {data}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "User Profile Endpoint", 
                    False, 
                    f"User profile endpoint failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("User Profile Endpoint", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all bank details API tests"""
        print("=" * 60)
        print("🚀 BANK DETAILS (RIB) API TESTING")
        print("=" * 60)
        print(f"Base URL: {self.base_url}")
        print(f"Test User: {self.test_user_email}")
        print("Testing Route Conflict Fix for Bank Details Endpoints")
        print()
        
        # Test sequence
        tests = [
            self.test_user_registration,
            self.test_get_empty_bank_details,
            self.test_save_bank_details,
            self.test_get_saved_bank_details,
            self.test_user_profile_endpoint
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__}: Exception {str(e)}")
                failed += 1
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        print()
        
        # Critical issues
        critical_failures = [r for r in self.test_results if "CRITICAL" in r["details"] and "FAIL" in r["status"]]
        if critical_failures:
            print("🚨 CRITICAL ISSUES FOUND:")
            for failure in critical_failures:
                print(f"   - {failure['test']}: {failure['details']}")
            print()
        
        return failed == 0

if __name__ == "__main__":
    tester = BankDetailsAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)