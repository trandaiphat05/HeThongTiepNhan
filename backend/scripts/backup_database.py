import sys
import os
import pyodbc

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))

db_folder = os.path.join(project_root, "database")
os.makedirs(db_folder, exist_ok=True)

backup_file = os.path.join(db_folder, "DongNaiCivicDB_20261121.bak")
print(f"Target SQL Server backup: {backup_file}")

conn_str = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost\\SQLEXPRESS02;DATABASE=DongNaiCivicDB;Trusted_Connection=yes;TrustServerCertificate=yes;"
try:
    conn = pyodbc.connect(conn_str, autocommit=True)
    cursor = conn.cursor()
    print("Executing BACKUP DATABASE...")
    cursor.execute(f"BACKUP DATABASE DongNaiCivicDB TO DISK = N'{backup_file}' WITH INIT, STATS = 10")
    while cursor.nextset():
        pass
    cursor.close()
    conn.close()
    print("Backup query finished.")
except Exception as e:
    print(f"SQL Server backup failed: {e}")

# Check files in database folder and their sizes
print("\n--- DATABASE FOLDER CONTENTS ---")
for f in sorted(os.listdir(db_folder)):
    fpath = os.path.join(db_folder, f)
    sz_bytes = os.path.getsize(fpath)
    sz_mb = sz_bytes / (1024 * 1024)
    print(f"{f}: {sz_bytes:,} bytes ({sz_mb:.2f} MB)")
