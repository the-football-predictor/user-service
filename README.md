# Users Service (Auth, Profiles)

### **Requirements**

* Handle user authentication and authorization (OAuth, JWT).
* Manage user profiles and sessions.
* Require database interactions (CRUD operations).

### Language: **Express.js with TypeScript**

 **Reason** : TypeScript provides safety for handling complex user objects, and the available libraries simplify OAuth and JWT management. If the user service does not require heavy concurrency, Node.js async handling is adequate.

### Users Table

Stores the user profile and basic account information.

```sql
sql
Copy code
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,         
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  
    created_at TIMESTAMP DEFAULT NOW()
    updated_at TIMESTAMP DEFAULT NOW()
    deleted_at TIMESTAMP DEFAULT NULL
);
```

* **user_id** : Primary key for user identification.
* **username** : Username for the player, used for displaying on leaderboards.
* **email** : User’s email for communication and login purposes.
* **password_hash** : Secure storage of the user's password.
* **created_at** : Timestamp for when the account was created.
* updated_at: Timestamp for when account was last updated.
* deleted_at: Timestamp for soft deletion.
