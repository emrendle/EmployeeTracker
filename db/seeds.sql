USE employees;

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES 
    ('Michael', 'Scott', 1, null), 
    ('Dwight', 'Schrute', 4, 1), 
    ('Pam', 'Beesly', 2, 1), 
    ('Jim', 'Halpert', 4, 1), 
    ('Robert', 'California', 1, null),
    ('Angela', 'Martin', 3, 1);

INSERT INTO role (title, salary, department_id)
VALUES
    ('Manager', 75000, 1),
    ('Receptionist', 30000, 2),
    ('Accountant', 50000, 3),
    ('Salesperson', 60000, 4);

INSERT INTO department (name)
VALUES
    ('Sales'),
    ('Accounting'),
    ('Office'),
    ('HR');