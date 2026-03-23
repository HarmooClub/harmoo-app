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

user_problem_statement: "9 critical modifications: messaging no auto-msg, new spectacle vivant category, self-like prevention, portfolio with media links, date format JJ/MM/AAAA, subscription commissions (15%/6%/0%), remove fake accounts, homepage larger cards, shareable profile link"

backend:
  - task: "Self-like prevention on favorites endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "Added check in POST /api/favorites/{id} that returns 400 if freelancer_id == current_user.id"
        - working: true
        - agent: "testing"
        - comment: "✅ TESTED: Self-like prevention working correctly. POST /api/favorites/{own_user_id} returns 400 error as expected. Logged in as couturier@test.com and attempted to like own profile - correctly blocked."

  - task: "New spectacle_vivant category in CATEGORIES_DATA"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "Added spectacle_vivant with subcategories: danseur, stand-uppeur, comédien, etc."
        - working: true
        - agent: "testing"
        - comment: "✅ TESTED: spectacle_vivant category exists with all expected subcategories: ['danseur', 'stand-uppeur', 'comédien', 'performance scénique', 'humoriste', 'metteur en scène', 'circassien', 'conteur']. GET /api/categories returns the category correctly."

  - task: "Conversation open endpoint without auto-message"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "New POST /api/conversations/open creates or gets conversation without sending message"
        - working: true
        - agent: "testing"
        - comment: "✅ TESTED: Conversation open endpoint working correctly. POST /api/conversations/open creates conversation without auto-message. Verified that GET /api/messages/{conversation_id} returns empty list after conversation creation."

  - task: "Profile slug generation and shareable link"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "Slug generated on registration, GET /api/p/{slug} returns profile. Startup migration adds slugs to existing users."
        - working: true
        - agent: "testing"
        - comment: "✅ TESTED: Profile slug generation working correctly. Registered new user 'Slug Test User' and received profile_slug in response. GET /api/p/{profile_slug} successfully returns the profile data. Shareable links functional."

  - task: "Portfolio links fields (YouTube, Spotify, Instagram, TikTok)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "PortfolioCreate and PortfolioItem models now have youtube_url, spotify_url, instagram_url, tiktok_url fields"
        - working: true
        - agent: "testing"
        - comment: "✅ TESTED: Portfolio media links working correctly. Created portfolio item with youtube_url and instagram_url. GET /api/portfolio returns the item with correct media links preserved."

  - task: "Commission rates updated (15%, 6%, 0%)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "SUBSCRIPTION_PLANS and commission_rates updated: essentiel 15%, standard 6%, business 0%"
        - working: true
        - agent: "testing"
        - comment: "✅ TESTED: Commission rates correct. GET /api/subscriptions/plans returns: essentiel 15%, standard 6%, business 0% commission rates as expected."

  - task: "Exclude own profile from freelancers feed"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "Added exclude_user_id parameter to GET /api/freelancers"
        - working: true
        - agent: "testing"
        - comment: "✅ TESTED: Own profile exclusion working correctly. GET /api/freelancers?exclude_user_id={user_id} correctly excludes the logged-in user's profile from 12 results returned."

  - task: "Delete all seeded/demo accounts on startup"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
        - agent: "main"
        - comment: "Startup migration deletes all users with is_seed=true and @harmoo-demo.fr emails"
        - working: true
        - agent: "testing"
        - comment: "✅ TESTED: Seeded accounts cleanup working correctly. GET /api/freelancers returns 13 freelancers with no @harmoo-demo.fr email addresses found. Demo accounts successfully removed."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
    - message: "All 9 modifications implemented. Backend changes: 1) Self-like blocked on POST /api/favorites/{id}. 2) spectacle_vivant category added. 3) POST /api/conversations/open creates conversation without sending message. 4) Profile slug on registration + GET /api/p/{slug}. 5) Portfolio model has youtube/spotify/instagram/tiktok URL fields. 6) Commissions: essentiel 15%, standard 6%, business 0%. 7) exclude_user_id param on GET /api/freelancers. 8) Startup migration deletes seeded accounts. Test credentials: test@test.com / test123 (client), couturier@test.com / test123 (freelancer). Base URL: https://stripe-payout-app.preview.emergentagent.com/api"
    - agent: "testing"
    - message: "✅ ALL BACKEND TESTS PASSED (12/12). Comprehensive testing completed for all 8 critical modifications: 1) Self-like prevention working (400 error), 2) spectacle_vivant category with all subcategories, 3) Conversation open without auto-message, 4) Profile slug generation and shareable links, 5) Portfolio media links (YouTube/Instagram), 6) Commission rates correct (15%/6%/0%), 7) Own profile exclusion from feed, 8) Seeded accounts cleanup. All endpoints functioning correctly with proper authentication and data validation. Backend implementation is complete and fully functional."
