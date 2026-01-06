# Family Vacation Picker - Requirements Document

## Overview

The Family Vacation Picker is an application designed to fairly select biannual family vacation destinations through weighted random selection. The system manages the complete vacation selection lifecycle from idea submission through random selection to finalization, ensuring fairness through submission weighting and eligibility rules.

## Core Concept

Families take vacations together every other year. Each eligible family member can propose destination ideas during an open submission period. Once all submissions are received, the system randomly selects a winner using weighted probabilities based on each submitter's win history. Family members who haven't won recently have higher chances of being selected. Fairness mechanisms prevent recent winners from dominating future selections.

## User Roles

- **Family Member**: Any authenticated member of the family who can submit proposals, vote, and view vacation information
- **Admin**: A family member with elevated permissions to manage vacation cycles and system configuration
- **System**: Automated processes for notifications, eligibility checks, and cycle management

## Business Rules

### BR-1: Vacation Cycle Timing

Vacations occur biannually (every other year).

### BR-2: Submission Eligibility

A family member whose proposal was selected for the previous vacation is **ineligible** to submit a proposal for the immediately following vacation cycle.

### BR-3: Submission Weighting

Proposals are assigned weights in the random selection process based on submitter history. Family members whose proposals were selected in more recent cycles receive **lower weight**, while those who haven't won recently receive **higher weight** to promote fairness over time.

### BR-4: Vacation States

Each upcoming vacation exists in one of two states:

- **Unfinalized**: Accepting submissions and/or awaiting random selection
- **Finalized**: A winning proposal has been randomly selected and the vacation is confirmed

### BR-5: Finalization Trigger

A vacation transitions from unfinalized to finalized once all eligible family members have submitted their proposals and the system randomly selects a winner based on weighted probabilities.

### BR-6: Editing Restrictions

Proposals can be edited only during the submission period. Once all eligible family members have submitted and the random selection process begins, proposals become locked and cannot be modified.

---

## User Stories

### Authentication & Security

**US-1: Secure Login with Email and Password**

> As a family member, I want to log in securely using my email and password, so that only authorized family members can access the application.

**US-1.1: Pre-Created Accounts for MVP**

> As an admin, I want to create family member accounts ahead of time with temporary passwords, so that the application can launch without requiring email infrastructure for account creation.

**US-1.2: Password Reset via Email (Future)**

> As a family member, I want to reset my password via email if I forget it, so that I can regain access to my account. _(Note: This feature requires email system integration in a future phase)_

---

### Vacation Cycle Management

**US-2: Track Vacation Timeline**

> As the system, I need to manage the biannual vacation cycle automatically, so that submission periods and random selection align with the family's vacation schedule.

**US-3: Manually Create Vacation Cycle**

> As an admin, I want to manually create a new vacation cycle, so that I can control when the submission period begins.

**US-4: Configure Vacation Cycle Settings**

> As an admin, I want to configure vacation cycle settings (such as submission deadlines and vacation year), so that the cycle aligns with the family's schedule and preferences.

---

### Proposal Submission

**US-5: Submit Vacation Proposal**

> As an eligible family member, I want to submit a vacation destination proposal including location, activities, and budget, so that my idea can be considered by the family.

**US-6: Generate Destination Image**

> As a family member submitting a proposal, I want to use an API to retrieve a representative image of my chosen destination, so that my proposal is visually appealing.

**US-7: Refresh Destination Image**

> As a family member, I want to shuffle/refresh the destination image if I don't like the first one shown, so that I can find the best visual representation of my proposal.

**US-8: AI-Generated Activity List**

> As a family member, I want the option to use AI to generate a summary of activities and attractions at my proposed destination, so that I can save time creating my proposal.

**US-9: Manual Activity Entry**

> As a family member, I want to opt out of AI-generated content and manually enter activity descriptions, so that I can personalize my proposal with my own research and ideas.

**US-10: Budget Estimation**

> As a family member, I want to provide a rough budget estimate for 4-5 nights at my proposed destination, so that the family can consider cost when voting.

**US-11: AI-Assisted Budget**

> As a family member, I want the option to use AI to help estimate the vacation budget, so that I don't have to research costs manually.

**US-12: Manual Budget Entry**

> As a family member, I want to opt out of AI budget estimation and enter my own calculations, so that I can provide a custom budget based on my research.

**US-13: View Submission Eligibility Status**

> As a family member, I want to see whether I'm eligible to submit a proposal for the current cycle, and if not, understand why in friendly terms, so that I understand the fairness rules without feeling excluded.

**US-14: Multiple Submissions per Cycle**

> As the system, I need to support multiple proposals from different family members during a single vacation cycle, so that everyone eligible can participate.

**US-15: Edit Submission During Submission Period**

> As a family member, I want to edit my vacation proposal during the submission period, so that I can refine my idea or correct mistakes.

**US-16: Prevent Editing After Submission Deadline**

> As the system, I need to lock proposals from editing once all submissions are received and selection begins, so that the integrity of the random selection process is maintained.

**US-17: View Edit Status**

> As a family member, I want to see whether my proposal can still be edited or is locked for selection, so that I understand when I can make changes.

---

### Random Selection & Finalization

**US-18: Apply Submission Weighting**

> As the system, I need to assign weights to each proposal based on the submitter's win history, so that family members who haven't won recently have higher chances in the random selection.

**US-19: Random Winner Selection**

> As the system, I need to randomly select a winning proposal using weighted probabilities once all eligible submissions are received, so that the destination is chosen fairly.

**US-20: View Selected Proposal**

> As a family member, I want to see which proposal was randomly selected, so that I know where the family will be vacationing.

**US-21: View All Proposals After Selection**

> As a family member, I want to view all submitted proposals even after one is selected, so that I can see what other options were considered.

**US-22: Selection Notification (Future)**

> As a family member, I want to be notified by email when the random selection is complete and a destination has been chosen, so that I'm immediately informed of the result. _(Note: This feature requires email system integration in a future phase)_

---

### Past Vacations & History

**US-23: Browse Past Vacations**

> As a family member, I want to view a list of past vacations the family has taken, so that I can reminisce and reference previous trips.

**US-24: View Past Vacation Details**

> As a family member, I want to click into a past vacation to see its details, so that I can review information about that trip.

**US-25: Consistent Vacation Page Layout**

> As a family member, I want past vacation pages and the next vacation page to share a similar layout, so that navigation and information discovery is consistent and intuitive.

**US-26: Embedded Map with Attractions**

> As a family member, I want to see an embedded Google Map on vacation pages showing nearby attractions, so that I can easily explore what the destination has to offer.

---

### Saved Ideas & Wishlist

**US-27: Save Proposal for Later**

> As a family member, I want to save proposals that didn't win (including others' proposals I liked), so that they can be revisited in future voting cycles.

**US-28: Add Ideas to Wishlist Anytime**

> As a family member, I want to add vacation ideas to my saved wishlist even when submissions aren't open, so that I can capture inspiration whenever it strikes.

**US-29: Wishlist Suggestions**

> As a family member, I want to see my previously saved ideas when a new submission period opens, so that I can easily reuse or refine ideas I've collected.

**US-30: Prepare Submission Content in Advance**

> As a family member, I want to fully develop a saved idea (with images, activities, budget) before the submission period, so that I'm ready to submit quickly when it opens.

---

### Notifications & Reminders

**US-31: Submission Period Reminder (Future)**

> As a family member, I want to receive an email when the submission period opens, so that I don't miss the opportunity to propose an idea. _(Note: This feature requires email system integration in a future phase)_

**US-32: Submission Deadline Reminder (Future)**

> As a family member, I want to receive an email reminder as the submission deadline approaches, so that I can ensure my proposal is submitted on time. _(Note: This feature requires email system integration in a future phase)_

---

### Engagement & Collaboration

**US-33: Comment on Proposals**

> As a family member, I want to add comments to vacation proposals during the submission period, so that I can ask questions, share enthusiasm, or provide feedback to the submitter.

**US-34: Comment Notifications (Future)**

> As a family member, I want to receive email notifications when someone comments on a proposal (especially mine), so that I can stay engaged in the discussion. _(Note: This feature requires email system integration in a future phase)_

**US-35: View Proposal Comments**

> As a family member, I want to read all comments on a proposal, so that I can understand others' perspectives and feedback.

**US-36: React to Proposals with Emojis**

> As a family member, I want to add emoji reactions to vacation proposals, so that I can quickly express my feelings or excitement about an idea without writing a full comment.

---

### Home & Navigation

**US-37: Display Next Vacation Status on Home Screen**

> As a family member, I want to see the status of the next upcoming vacation on the home screen (whether it's open for submissions, awaiting selection, or finalized), so that I know what actions I can take.

**US-38: Show Submission Period Date on Home Screen**

> As a family member, I want to see when the next submission period opens on the home screen if it's not yet active, so that I can plan when to submit my ideas.

**US-39: Quick Access to Next Vacation**

> As a family member, I want to see a prominent link to the next vacation on the home screen, so that I can quickly access the most relevant information.

**US-40: Home Screen Past Vacation List**

> As a family member, I want to see a list of past vacations on the home screen, so that I can easily navigate to previous trip details.

---

## Additional Considerations

### Data to Capture for Each Proposal

- Destination/location name
- Destination image
- Activity list/description
- Budget estimate (4-5 nights)
- Submitter
- Submission timestamp

### Data to Capture for Each Finalized Vacation

- Winning proposal (selected through weighted random selection)
- All submitted proposals
- Selection weights applied to each proposal
- Selection date
- Trip year

### Future Considerations

The specific content and layout for past vacation detail pages is not yet defined and may be determined during design/implementation phases.

The exact weighting algorithm (how much weight difference between recent winners vs. non-winners) will be determined during implementation.

### Phased Implementation

**MVP Phase**: The application will launch with pre-created user accounts (email/password authentication) and manual admin processes. Email-dependent features (password reset, notifications) will be deferred to a future phase.

**Future Phase**: Email system integration will enable automated notifications (submission reminders, deadline reminders, selection notifications, comment notifications) and password reset functionality.
