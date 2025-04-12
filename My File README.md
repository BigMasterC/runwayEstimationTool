# Redone Est Tool

## Command to Start the Webpage

Run these commands in the terminal under the following directory:  
`C:\Users\domin\.cursor-tutor\redoneEstTool`

To start just the backend:
```bash
npm run server
```

To start the React frontend:
```bash
npm start
```

## How I Got Cursor to Make It

I initially asked:  
**"How can I run and view the output of this code?"**  
*(code from: https://poe.com/s/igFajY2Z9TrdWt0X1IfN)*

Then I asked it to:
**"Update the code for the dashboard so that it has an Express.js backend that connects to a PostgreSQL database to determine the outcome of the Historical Storage Usage and Forecasted Storage Usage graphs."**

## Database Stuff I Learned

I'm using PostgreSQL (psql, for short).  
**Remember: ";" terminates the language!**

### Useful Commands:
- `createdb [DATABASE NAME]` - Creates a database via the command line.
- `psql -U [USERNAME] -d [DATABASE NAME]` - Connects to a database (e.g., `"domin"` is my user).
- `psql -l` - Lists all databases under your account.
- `\dt` - View all the tables in your database.
- `SELECT * FROM [TABLE NAME];` - View all the contents of a table (both rows and columns).
