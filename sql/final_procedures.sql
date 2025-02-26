-- create the database
CREATE DATABASE final_advanced_sql;

-- use the databse
USE final_advanced_sql;

-- create action log table
CREATE TABLE user_management_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    log_entry JSON
);

-- action logging procedure
DELIMITER //

CREATE PROCEDURE LogUserAction(
    IN action_type VARCHAR(50),
    IN performed_by VARCHAR(50),
    IN target_user VARCHAR(50),
    IN details TEXT
)
BEGIN
    INSERT INTO user_management_log (log_entry)
    VALUES (
        JSON_OBJECT(
            'action_type', action_type,
            'performed_by', performed_by,
            'target_user', target_user,
            'details', details,
            'timestamp', NOW()
        )
    );
END //

DELIMITER ;

-- Create new user
DELIMITER //

CREATE PROCEDURE CreateUser(
    IN new_username VARCHAR(50),
    IN new_password VARCHAR(255),
    IN read_only BOOLEAN
)
BEGIN
    DECLARE user_exists INT DEFAULT 0;
    DECLARE executing_admin VARCHAR(100);

    -- Get the name of the current user performing the action
    SET executing_admin = USER(); 

    -- Check if the user already exists
    SELECT COUNT(*) INTO user_exists
    FROM mysql.user
    WHERE user = new_username;

    IF user_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User already exists';
    ELSE
        -- Create user
        SET @create_user = CONCAT('CREATE USER "', new_username, '"@"localhost" IDENTIFIED BY "', new_password, '"');
        PREPARE stmt FROM @create_user;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        -- Grant read-only permissions if needed
        IF read_only THEN
            SET @grant_perm = CONCAT('GRANT SELECT ON *.* TO "', new_username, '"@"localhost"');
        END IF;
        PREPARE stmt FROM @grant_perm;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        -- Log the action
        CALL LogUserAction(
            'CREATE USER',
            executing_admin,
            new_username,
            CONCAT('Created with read-only=', read_only)
        );

    END IF;
END //

DELIMITER ;

-- Change password for user
DELIMITER //

CREATE PROCEDURE ChangeUserPassword(
    IN username VARCHAR(50),
    IN new_password VARCHAR(255)
)
BEGIN
    DECLARE executing_admin VARCHAR(100);
    SET executing_admin = USER(); -- Automatically capture the admin name

    -- Change password
    SET @change_pw = CONCAT('ALTER USER "', username, '"@"localhost" IDENTIFIED BY "', new_password, '"');
    PREPARE stmt FROM @change_pw;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- Log the action
    CALL LogUserAction(
        'CHANGE USER PASSWORD',
        executing_admin,
        username,
        'Password changed'
    );
END //

DELIMITER ;

-- grant/revoke user rights for reading DB
DELIMITER //

CREATE PROCEDURE ModifyUserPermissions(
    IN username VARCHAR(50),
    IN database_name VARCHAR(100),
    IN add_permission BOOLEAN -- TRUE = Grant, FALSE = Revoke
)
BEGIN
    DECLARE executing_admin VARCHAR(100);
    SET executing_admin = USER(); -- Automatically capture the admin name

    -- Construct the SQL statement dynamically
    IF add_permission THEN
        SET @modify_perm = CONCAT('GRANT SELECT ON ', database_name, '.* TO "', username, '"@"localhost"');
    ELSE
        SET @modify_perm = CONCAT('REVOKE SELECT ON ', database_name, '.* FROM "', username, '"@"localhost"');
    END IF;

    -- Execute the permission change
    PREPARE stmt FROM @modify_perm;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- Log the action
    CALL LogUserAction(
        'MODIFY USER PERMISSIONS',
        executing_admin,
        username,
        IF(add_permission, 
           CONCAT('Granted READ ONLY on ', database_name), 
           CONCAT('Revoked READ ONLY on ', database_name))
    );

END //

DELIMITER ;

-- get permissions for user
DELIMITER //

CREATE PROCEDURE GetUserPermissions(
    IN username VARCHAR(50)
)
BEGIN
    DECLARE user_exists INT DEFAULT 0;

    -- Check if the user exists
    SELECT COUNT(*) INTO user_exists
    FROM mysql.user
    WHERE user = username;

    -- If user exists, list permissions
    IF user_exists > 0 THEN
        SELECT grantee, privilege_type
        FROM information_schema.user_privileges
        WHERE grantee LIKE CONCAT("'", username, "'@'localhost'");
    ELSE
        SELECT 'User does not exist' AS message;
    END IF;
END //

DELIMITER ;