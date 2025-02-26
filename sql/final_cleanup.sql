use final_advanced_sql;

-- drop procedures
DROP procedure if exists CreateUser;
DROP procedure if exists ChangeUserPassword;
DROP procedure if exists ModifyUserPermissions;
DROP procedure if exists GetUserPermissions;

-- drop tables
drop table if exists user_management_log;

-- drop the database
drop database if exists final_advanced_sql;
