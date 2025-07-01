#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready; do
  sleep 1
done

echo "Running initialization scripts from subdirectories..."

# Check if initialization has already been done
if psql -tAc "SELECT 1 FROM information_schema.tables WHERE table_name = 'init_status'" | grep -q 1; then
    echo "Database already initialized, skipping..."
    exit 0
fi

# Convert comma-separated list to array
IFS=',' read -ra DIR_ARRAY <<< "01_extensions,02_tables,03_functions"

# Process each directory in order
for dir in "${DIR_ARRAY[@]}"; do
    dir_path="/init-scripts/$dir"
    
    if [ -d "$dir_path" ]; then
        echo "Processing directory: $dir"
        
        # Find all .sql files in the directory and sort them
        find "$dir_path" -name "*.sql" -type f | sort | while read -r script; do
            if [ -f "$script" ]; then
                echo "  Executing $(basename "$script")..."
                psql -f "$script"
            fi
        done
        
        echo "  Completed directory: $dir"
    else
        echo "  Directory not found: $dir_path (skipping)"
    fi
done

# Also process any .sql files in the root init-scripts directory
echo "Processing root directory scripts..."
find /init-scripts -maxdepth 1 -name "*.sql" -type f | sort | while read -r script; do
    if [ -f "$script" ]; then
        echo "  Executing $(basename "$script")..."
        psql -f "$script"
    fi
done

# Mark as initialized
psql -c "CREATE TABLE init_status (initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"
psql -c "INSERT INTO init_status DEFAULT VALUES;"

echo "Initialization completed successfully!"