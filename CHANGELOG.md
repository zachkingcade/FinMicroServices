# Changelog
This changelog lists the features and major strokes of UI that have changed across the diffrent versions of the software. <br>
Features start being listed after the release of one version into the next before the release of the next. This version <br>
number is also used for the commit messages mentioned in the format described in the COMMIT.md file.<br>

## Verison 1.0.0 
<b>(Minimal Viable Product)</b> <br>
TLDR: This is the very start of the project starting from nothing and bringing us up to the minimal viable product.
- Feature Added: Add Account type
- Feature Added: Add Transaction
- Feature Added: Add Account
- Feature Added: Upload Bank file (USAA only reconized format currently)
- Feature Added: Reconcile Pending Transaction
- Feature Added: Delete Transaction
- Feature Added: Delete Pending Transaciton
- Feature Added: Split Pending Transaciton
- Feature Added: Show Account increase/decrease on both reconcile and split pending transaction
- Feature Added: Account balannce is calculated based on accounting equation type class
- Feature Added: Logging added to all services
- UI Update: overhauled UI theme to an ocean blue

## Version 1.1.0
- New default sort orders for Account service queries
- Added Commit Standard and updated changelog format
- Added increase/decrease account indicator to ledger page's manual transaction entry fields
- <b>Bugfix</b>: Corrected floating point rounding error in Transactions Service summarazation system 