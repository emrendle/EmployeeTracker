const mysql = require('mysql');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
  host: 'localhost',

  port: 3306,

  user: 'root',

  password: 'emroot0991',
  database: 'employees',
});

const loadPrompts = () => {
  inquirer
  // get the info from user to create an auction - passing this into the connection query to add to the db
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
        console.log(answer.prompts);
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

const getAllEmployees = () => {
  connection.query('SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS "department", employee.manager_id FROM employee INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id', (err, res) => {
    if (err) throw err;
    console.table(res);
    loadPrompts();
  });
};

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
      connection.query('SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS "department", employee.manager_id FROM employee INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id WHERE ?', { name: answer.department }, (err, res) => {
        if (err) throw err;
        console.table(res);
        loadPrompts();
      });
    });
}

// needs to be changed to dynamically load options
const addEmployee = () => {
  let managerInfo = [];
  let managerChoice = [];
  let roleChoice = [];

  connection.query('SELECT employee.first_name, employee.last_name, employee.id FROM employee WHERE role_id = ?', [1], (err, res) => {
    if (err) throw err;
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
        const splitManager = answer.manager.split(' ');
        for (i = 0; i < managerInfo.length; i++) {
          if (splitManager[0] === managerInfo[i].first_name && splitManager[1] === managerInfo[i].last_name) {
            foundManagerId = managerInfo[i].id;
          }
        }
        res.forEach(value => {
          if (answer.role === value.title) {
            foundRoleId = value.id;
          }
        });

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
            console.log(`${answer.firstName} ${answer.lastName} has been added.`);
            loadPrompts();
            }
          );
        });
      });
  });
}

const remEmployee = () => {
  let remChoices = [];

  // finding all employee first and last names from mysql
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
            console.log(`${remFirstName} ${remLastName} has been removed.`);
            loadPrompts();
          });
      });
  });
}

const updEmployeeRole = () => {
  let updEmplChoices = [];
  let roleChoices = [];
  let roleInfo = [];

  // queries first and last name from employee table
  connection.query("SELECT employee.first_name, employee.last_name FROM employee", (err, res) => {
    if (err) throw err; 

    res.forEach(choice => {
      fullName = `${choice.first_name} ${choice.last_name}`;
      updEmplChoices.push(fullName);
    });
  });

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

        res.forEach(value => {
          if (answer.roleUpd === value.title) {
            newRoleId = value.id;
          }
        });

        connection.query("UPDATE employee SET role_id = ? WHERE first_name = ? AND last_name = ?", [newRoleId, chosenName[0], chosenName[1]], (err, res) => {
          if (err) throw err; 
            console.log(`${chosenName.join(' ')}'s role has been updated.`)
            loadPrompts();
        });
    });
  });
}

const getAllRoles = () => {
  connection.query('SELECT role.title, role.salary, role.department_id FROM role', (err, res) => {
    if (err) throw err;
    console.table(res);
    loadPrompts();
  });
}

const addRole = () => {
  let roleChoices = [];

  connection.query("SELECT department.name, department.id FROM department", (err, res) => {
    if(err) {
      throw err;
    } else {
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
        res.forEach(value => {
          if (answer.department === value.name) {
            departmentId = value.id;
          }
        });

        connection.query(
          'INSERT INTO role SET ?',
            {
            title: answer.roleTitle,
            salary: answer.salary,
            department_id: departmentId,
            },
        
          (err, res) => {
            if (err) throw err;
            console.log(`${answer.roleTitle} has been added as a role.`);
            loadPrompts();
          }
        );
      });
    }
  });
}

connection.connect((err) => {
    if (err) throw err;
    console.log(`Connected as id ${connection.threadId}`);
    loadPrompts()
});