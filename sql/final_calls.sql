call CreateUser('test_user2','123456',true);
call ChangeUserPassword('test_user2','abc123');
call ModifyUserPermissions('test_user2','final_advanced_sql',true);
call GetUserPermissions('test_user2');