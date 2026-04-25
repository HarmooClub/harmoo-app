#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

user_problem_statement: "Fix RIB (bank details) addition on 'Caisse' page - save button doesn't work and doesn't save"

backend:
  - task: "Self-like prevention on favorites endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
        - working: true
        - agent: "testing"
        - comment: "Previously tested and working"

  - task: "Bank details route conflict fix (GET/PUT /api/users/bank-details)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: false
        - agent: "main"
        - comment: "ROOT CAUSE FOUND: GET /api/users/bank-details was intercepted by GET /api/users/{user_id} (defined earlier in server.py). 'bank-details' was being treated as a user_id, returning 404. FIX: Moved BankDetailsUpdate model and both GET/PUT /api/users/bank-details endpoints BEFORE the /api/users/{user_id} route. Removed duplicate definitions at old location. Verified: curl GET /api/users/bank-details now returns 403 (Not authenticated) instead of 404 (Utilisateur non trouvé)."
        - working: true
        - agent: "testing"
        - comment: "✅ ROUTE CONFLICT FIXED! Comprehensive testing completed: 1) Registered test user ribtest4@test.com successfully, 2) GET /api/users/bank-details with valid token returns {} (empty bank details) instead of 404 'Utilisateur non trouvé', 3) PUT /api/users/bank-details successfully saves bank details with message 'Coordonnées bancaires mises à jour', 4) GET /api/users/bank-details returns saved data with correct iban_masked (****0189), 5) GET /api/users/{user_id} still works correctly (route integrity maintained). Fixed minor bug in get_bank_details function where bank_details could be None. All critical endpoints working as expected."

  - task: "Bank details save endpoint (PUT /api/users/bank-details)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "PUT endpoint validates IBAN length (15-34 chars), stores iban, bic, account_holder in user document. Was previously reachable (no route conflict for PUT) but GET was broken so the full flow failed."
        - working: true
        - agent: "testing"
        - comment: "✅ WORKING PERFECTLY! PUT /api/users/bank-details successfully saves bank details. Tested with IBAN: FR7630006000011234567890189, BIC: BNPAFRPP, account_holder: Jean Dupont. Returns correct success message 'Coordonnées bancaires mises à jour'. Data persists correctly and is retrievable with proper IBAN masking (****0189). Full bank details flow working end-to-end."

metadata:
  created_by: "main_agent"
  version: "3.0"
  test_sequence: 3
  run_ui: false

test_plan:
  current_focus:
    - "Bank details route conflict fix (GET/PUT /api/users/bank-details)"
    - "Bank details save endpoint (PUT /api/users/bank-details)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
    - message: "Fixed critical route conflict bug. The GET /api/users/bank-details endpoint was being captured by GET /api/users/{user_id} (defined on line 829) because FastAPI matches routes in definition order. 'bank-details' was treated as a user_id. FIX: Moved bank details endpoints BEFORE the parameterized route. Please test: 1) Register a test user (POST /api/auth/register), 2) Login to get token, 3) GET /api/users/bank-details with token should return empty {}, 4) PUT /api/users/bank-details with iban/bic/account_holder should save, 5) GET /api/users/bank-details should now return saved data with iban_masked. Base URL: http://localhost:8001/api. Test user: any new registration or use existing test@test.com / test123"
    - agent: "testing"
    - message: "🎉 BANK DETAILS (RIB) API TESTING COMPLETE - ALL CRITICAL TESTS PASSED! ✅ Route conflict successfully fixed - GET /api/users/bank-details now returns {} instead of 404 'Utilisateur non trouvé' ✅ PUT /api/users/bank-details successfully saves bank details ✅ GET /api/users/bank-details returns saved data with correct IBAN masking (****0189) ✅ User profile endpoint /api/users/{user_id} still works correctly. Fixed 2 minor bugs during testing: 1) bank_details null handling in get_bank_details function, 2) avatar null handling in registration. Test user: ribtest4@test.com. The original user problem 'save button doesn't work and doesn't save' on Caisse page is now resolved at the API level."
