# Changelog
This changelog lists the features and major strokes of UI that have changed across the diffrent versions of the software. <br>
Features start being listed after the release of one version into the next before the release of the next. This version <br>
number is also used for the commit messages mentioned in the format described in the COMMIT.md file.<br>

## Verison 1.0.0 
<b>(Minimal Viable Product)</b> <br>
TLDR: This is the very start of the project starting from nothing and bringing us up to the minimal viable product.
- Added: Add Account type
- Added: Add Transaction
- Added: Add Account
- Added: Upload Bank file (USAA only reconized format currently)
- Added: Reconcile Pending Transaction
- Added: Delete Transaction
- Added: Delete Pending Transaciton
- Added: Split Pending Transaciton
- Added: Show Account increase/decrease on both reconcile and split pending transaction
- Added: Account balannce is calculated based on accounting equation type class
- Added: Logging added to all services
- UI Update: overhauled UI theme to an ocean blue

## Version 1.1.0
<b>(Workflow Clean Up)</b> <br>
- Added: default sort orders for Account service queries
- Added: Commit Standard and updated changelog format
- Added: increase/decrease account indicator to ledger page's manual transaction entry fields
- Bugfix: Corrected floating point rounding error in Transactions Service summarazation system
- Added: TODO tracking system
- UI Update: Split modal now shows remaining balance
- Added: Allowed local hosting of services on local network instead of strictly on host system
- Added: Ability to edit active state, account description and notes for accounts
- Added: Ability to edit active state, account type description and notes for account types
- Added: Ability to edit notes for transactions on the ledger page
- UI Update: Removed primary key from tables
- UI Update: Corrected Split Modal styling to better match
- UI Update: Corrected Delete Modal styling to better match
- Added: Restriciton on account selection to remove all inactive accounts
- Added: Restriciton on account type selection to remove all inactive account types

## Version 1.2.0
<b>(Fitlers and sorts)</b> <br>
- Added: Sorting the accounts table
- Added: Sorting the Account types table
- Added: Sorting the Ledger table
- Added: Filters to better organized the data of the accounts table
- Added: Filters to better organized the data of the account types table
- Added: Filters to better organized the data of the ledger table