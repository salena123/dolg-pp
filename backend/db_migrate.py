from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migrations():
    # Create engine without database name first
    temp_engine = create_engine(
        f"mysql+mysqlconnector://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}"
    )
    
    # Connect and create database if not exists
    with temp_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME}"))
        conn.execute(text(f"USE {settings.DB_NAME}"))
        
        # Check if user_id column exists in employers table
        result = conn.execute(
            text("""
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = :db_name
            AND TABLE_NAME = 'employers'
            AND COLUMN_NAME = 'user_id'
            """),
            {"db_name": settings.DB_NAME}
        ).scalar()
        
        if not result:
            # Add user_id column if it doesn't exist
            print("Adding user_id column to employers table...")
            conn.execute(text("""
                ALTER TABLE employers 
                ADD COLUMN user_id INT NULL AFTER id,
                ADD UNIQUE INDEX user_id_UNIQUE (user_id ASC) VISIBLE;
            
                ALTER TABLE employers 
                ADD CONSTRAINT fk_employer_user
                FOREIGN KEY (user_id) REFERENCES users(id)
                ON DELETE CASCADE;
            
                -- Make user_id NOT NULL after adding the column
                ALTER TABLE employers 
                MODIFY COLUMN user_id INT NOT NULL;
            
                -- Add unique constraint to ensure one-to-one relationship
                ALTER TABLE employers
                ADD UNIQUE (user_id);
            
                -- Update existing employers if needed
                -- This is a temporary solution - you'll need to map existing users to employers
                -- For now, we'll set a default user_id (you should update this with proper mapping)
                UPDATE employers SET user_id = (SELECT id FROM users WHERE email = contact_email LIMIT 1) 
                WHERE user_id IS NULL;
            
                -- Finally, make user_id NOT NULL
                ALTER TABLE employers 
                MODIFY COLUMN user_id INT NOT NULL;
            
                print("Database schema updated successfully!")
            """))
        else:
            print("Database schema is up to date.")

if __name__ == "__main__":
    run_migrations()
