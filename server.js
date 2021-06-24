// dependencies
const mysql = require('mysql');
const inquirer = require('inquirer');

// establishing mysql connection information
const connection = mysql.createConnection({
  host: 'localhost',

  port: 3306,

  user: 'root',

  password: 'emroot0991',
  database: 'employees',
});

// loads the main menu of prompts for the application
const loadPrompts = () => {
  inquirer
      .prompt([
          {
              name: 'prompts',
              type: 'rawlist',
              message: "What would you like to do?",
              choices: [
                "View all employees", 
                "View all employees by department", 
                "Add employee", 
                "Remove employee", 
                "Update employee role", 
                "View all roles", 
                "Add role", 
                "Remove role", 
                "View all departments", 
                "Add department", 
                "Remove department", 
                "Quit"
              ],
          },
      ])
      .then((answer) => {
        // evaluating user choice, calling appropriate function
        if (answer.prompts === "View all employees") {
          getAllEmployees();
        } else if (answer.prompts === "View all employees by department") {
          getEmployeesByDept();
        } else if (answer.prompts === "Add employee") {
          addEmployee();
        } else if (answer.prompts === "Remove employee") {
          remEmployee();
        } else if (answer.prompts === "Update employee role") {
          updEmployeeRole();
        } else if (answer.prompts === "View all roles") {
          getAllRoles();
        } else if (answer.prompts === "Add role") {
          addRole();
        } else if (answer.prompts === "Remove role") {
          remRole();
        } else if (answer.prompts === "View all departments") {
          getAllDept();
        } else if (answer.prompts === "Add department") {
          addDept();
        } else if (answer.prompts === "Remove department") {
          remDept();
        } else if (answer.prompts === "Quit") {
          quit();
        }
  })
};

// displays all employees
const getAllEmployees = () => {
  // uses the employee's role id and the role's department id to create one table where all information can be viewed
  connection.query('SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS "department", employee.manager_id FROM employee INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id', (err, res) => {
    if (err) throw err;
    console.table(res);
    // returns user to main menu
    loadPrompts();
  });
};

// displays all employees by selected department
const getEmployeesByDept = () => {
  inquirer
    .prompt({
      name: 'department',
      type: 'rawlist',
      message: 'What department would you like to view?',
      choices: [
        "Management",
        "Administration",
        "Accounting",
        "Sales"
      ]
    })
    .then((answer) => {
      // shows the same information as getAllEmployees but includes a where ? clause that filters results by department
      connection.query('SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS "department", employee.manager_id FROM employee INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id WHERE ?', { name: answer.department }, (err, res) => {
        if (err) throw err;
        console.table(res);
        loadPrompts();
      });
    });
};

// adds a new employee
const addEmployee = () => {
  // empty arrays to store data from mysql query - used to populate inquirer choices below
  let managerInfo = [];
  let managerChoice = [];
  let roleChoice = [];

  // getting managers to present user with a list of managers to assign the new employee to
  connection.query('SELECT employee.first_name, employee.last_name, employee.id FROM employee WHERE role_id = ?', [1], (err, res) => {
    if (err) throw err;

    // loops through query results, joins first and last name as single string, pushes to array to be presented as inquirer choice below
    // managerobj is used to store the manager id so that the manager id can later be assigned to the new employee
    res.forEach(value => {
      managerName = `${value.first_name} ${value.last_name}`
      managerChoice.push(managerName);
      let managerObj = {
        first_name: value.first_name,
        last_name: value.last_name,
        id: value.id,
      }
      managerInfo.push(managerObj);
    });

    // getting role title and id from db to present as choices for inquirer
    connection.query('SELECT role.title, role.id FROM role', (err, res) => {
      if (err) throw err;

      res.forEach(value => {
        roleChoice.push(value.title);
      });

      inquirer
      .prompt([
        {
          name: 'firstName',
          type: 'input',
          message: "What is the employee's first name?",
        },
        {
          name: 'lastName',
          type: 'input',
          message: "What is the employee's last name?",
        },
        {
          name: 'manager',
          type: 'rawlist',
          message: "Who is this employee's manager?",
          choices: managerChoice,
        },
        {
          name: 'role',
          type: 'rawlist',
          message: "What is this employee's role?",
          choices: roleChoice,
        },
      ])
      .then((answer) => {  

        // checks for a strict match between the user selected manager and the manager information queried with mysql - if there is a match, the manager id stored to a variable to be assigned to the new employee
        const splitManager = answer.manager.split(' ');
        for (i = 0; i < managerInfo.length; i++) {
          if (splitManager[0] === managerInfo[i].first_name && splitManager[1] === managerInfo[i].last_name) {
            foundManagerId = managerInfo[i].id;
          }
        }

        // checks for a match between user chosen role and all possible role titles returned from query - pulls out the matching id and assigns to variable to be assigned to new employee
        res.forEach(value => {
          if (answer.role === value.title) {
            foundRoleId = value.id;
          }
        });

        // inserting new employee with all the info generated above, including role id and manager id's 
        connection.query(
          'INSERT INTO employee SET ?',
            {
            first_name: answer.firstName,
            last_name: answer.lastName,
            role_id: foundRoleId,
            manager_id: foundManagerId,
            },
  
          (err, res) => {
            if (err) throw err;
            console.log(`\n-----\n${answer.firstName} ${answer.lastName} has been added.\n-----\n`);
            loadPrompts();
            }
          );
        });
      });
  });
};

// removes an employee
const remEmployee = () => {
  let remChoices = [];

  // finding all employee first and last names from mysql to be presented as inquirer choices
  connection.query("SELECT employee.first_name, employee.last_name FROM employee", (err, res) => {
    if (err) throw err;
      res.forEach(choice => {
        fullName = `${choice.first_name} ${choice.last_name}`;
        remChoices.push(fullName);
      });
  
      inquirer.prompt([
        {
          name: "employeeRemove",
          type: "rawlist",
          message: "Which employee would you like to remove?",
          choices: remChoices,
        }
      ])
        .then((answer) => {
          // splits the previously joined string into individual words that serve as first and last name
          const splitAnswer = answer.employeeRemove.split(' ');
          // removes employee from db where there is a name match - it would probably be better (less error prone) to delete by id in case there are employees with identical names
          connection.query(`DELETE FROM employee WHERE first_name = ? AND last_name = ?`, [splitAnswer[0], splitAnswer[1]] , (err, res) => {
            if (err) throw err;
            console.log(`\n-----\n${answer.employeeRemove} has been removed.\n-----\n`);
            loadPrompts();
          });
      });
  });
};

// updates employee's role
const updEmployeeRole = () => {
  let updEmplChoices = [];
  let roleChoices = [];
  let roleInfo = [];

  // queries first and last name from employee table to present them as choices within inquirer
  connection.query("SELECT employee.first_name, employee.last_name FROM employee", (err, res) => {
    if (err) throw err; 

    res.forEach(choice => {
      fullName = `${choice.first_name} ${choice.last_name}`;
      updEmplChoices.push(fullName);
    });
  });

  // finding role title for inquirer choices and role id for updating employee role id later
  connection.query("SELECT role.title, role.id FROM role", (err, res) => {
    if (err) throw err;

    res.forEach(role => {
      let roleObj = {
        title: role.title,
        id: role.id,
      }
      roleChoices.push(role.title);
      roleInfo.push(roleObj);
    });

    inquirer.prompt([
      {
        name: "employeeUpd",
        type: "rawlist",
        message: "Which employee would you like to update?",
        choices: updEmplChoices,
      },
      {
        name: "roleUpd",
        type: "rawlist",
        message: "What is this employee's new role?",
        choices: roleChoices,
      },
    ])
      .then((answer) => {
        let chosenName = answer.employeeUpd.split(' ');

        // comparing user choice to all possible roles from query - if match, returns the id for the selected role
        res.forEach(value => {
          if (answer.roleUpd === value.title) {
            newRoleId = value.id;
          }
        });

        // updates the employee's role id in the db where there is a first and last name match - would be much safer to update employee based on employee id instead of by name, in case there are employees with identical names
        connection.query("UPDATE employee SET role_id = ? WHERE first_name = ? AND last_name = ?", [newRoleId, chosenName[0], chosenName[1]], (err, res) => {
          if (err) throw err; 
            console.log(`\n-----\n${chosenName.join(' ')}'s role has been updated.\n-----\n`)
            loadPrompts();
        });
    });
  });
};

// shows all roles
const getAllRoles = () => {
  connection.query('SELECT role.title, role.salary, role.department_id FROM role', (err, res) => {
    if (err) throw err;
    console.table(res);
    loadPrompts();
  });
};

// adds a role
const addRole = () => {
  let roleChoices = [];

  // finding department name and id's from db to provide user with the choice of what department to insert the role into
  connection.query("SELECT department.name, department.id FROM department", (err, res) => {
    if (err) throw err

      res.forEach(value => {
        roleChoices.push(value.name);
      });

      inquirer
      .prompt([
        {
          name: 'roleTitle',
          type: 'input',
          message: "What is the title of this role?",
        },
        {
          name: 'salary',
          type: 'input',
          message: "What is the salary for this position?",
        },
        {
          name: "department",
          type: "rawlist",
          message: "Which department should this role be added to?",
          choices: roleChoices,
        },
      ])
      .then((answer) => {
        // if the answer matches a department from the db, grabs the department id for assignment to new role in db
        res.forEach(value => {
          if (answer.department === value.name) {
            departmentId = value.id;
          }
        });
        // adds role to db
        connection.query(
          'INSERT INTO role SET ?',
            {
            title: answer.roleTitle,
            salary: answer.salary,
            department_id: departmentId,
            },
        
          (err, res) => {
            if (err) throw err;
            console.log(`\n-----\nA new role has been added: ${answer.roleTitle}.\n-----\n`);
            loadPrompts();
          }
        );
      });
  });
};

// removes a role
const remRole = () => {
  let remRoleChoices = [];

  // finds all roles to present as inquirer choices
  connection.query("SELECT role.title FROM role", (err, res) => {
    if (err) throw err;
      res.forEach(choice => {
        remRoleChoices.push(choice.title);
      });
  
      inquirer.prompt([
        {
          name: "roleRemove",
          type: "rawlist",
          message: "Which role would you like to remove?",
          choices: remRoleChoices,
        }
      ])
        .then((answer) => {
          // removes role based on title selected from inquirer
          connection.query(`DELETE FROM role WHERE role.title = ?`, [answer.roleRemove] , (err, res) => {
            if (err) throw err;
            console.log(`\n-----\n${answer.roleRemove} has been removed.\n-----\n`);
            loadPrompts();
          });
      });
  });
};

// displays all departments
const getAllDept = () => {
  connection.query('SELECT department.name FROM department', (err, res) => {
    if (err) throw err;
    console.table(res);
    loadPrompts();
  });
};

// adds new department
const addDept = () => {
  inquirer.prompt([
    {
      name: "deptName",
      type: "input",
      message: "What is the name of the new department?",
    }
  ])
    .then((answer) => {
      connection.query(
        'INSERT INTO department SET ?',
          {
          name: answer.deptName,
          },
      
        (err, res) => {
          if (err) throw err;
          console.log(`\n-----\nA new department has been added: ${answer.deptName}.\n-----\n`);
          loadPrompts();
        }
      );
  });
};

// removes existing department
const remDept = () => {
  let deptChoices = [];

  // used to display choices for which department to remove - will only return existing departments
  connection.query("SELECT department.name FROM department", (err, res) => {
    if (err) throw err;
      res.forEach(choice => {
        deptChoices.push(choice.name);
      });
  
      inquirer.prompt([
        {
          name: "deptRemove",
          type: "rawlist",
          message: "Which department would you like to remove?",
          choices: deptChoices,
        }
      ])
        .then((answer) => {
          // deletes department based on user choice
          connection.query(`DELETE FROM department WHERE department.name = ?`, [answer.deptRemove] , (err, res) => {
            if (err) throw err;
            console.log(`\n-----\n${answer.deptRemove} and its employees have been removed.\n-----\n`);
            loadPrompts();
          });
      });
  });
};

// exits application
const quit = () => {
  process.exit();
}

// establishes connection loads prompts to begin application
connection.connect((err) => {
    if (err) throw err;
    console.log(`Connected as id ${connection.threadId}`);
    loadPrompts()
});