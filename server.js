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

const addEmployee = () => {
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
        choices: [
        "Michael Scott",
        "Robert California",
        ]
      },
      {
        name: 'role',
        type: 'rawlist',
        message: "What is this employee's role?",
        choices: [
        "Salesperson",
        "Receptionist",
        "Accountant"
        ]
      },
    ])
    .then((answer) => {
      if (answer.role === "Salesperson") {
      answer.role = 4;
      } else if (answer.role === "Receptionist") {
      answer.role = 2;
      } else if (answer.role === "Accountant") {
      answer.role = 3;
      }

      if (answer.manager === "Michael Scott") {
      answer.manager = 1;
      } else if (answer.manager === "Robert California") {
      answer.manager = 5;
      }

      connection.query(
        'INSERT INTO employee SET ?',
          {
          first_name: answer.firstName,
          last_name: answer.lastName,
          role_id: answer.role,
          manager_id: answer.manager,
          },

        (err, res) => {
          if (err) throw err;
          console.log(`${answer.firstName} ${answer.lastName} has been added.`);
          loadPrompts();
        }
      );
  });
}

const remEmployee = () => {
  let remChoices = [];
  let joinedRemChoices = [];

  // finding all employee first and last names from mysql
  connection.query("SELECT employee.first_name, employee.last_name FROM employee", (err, res) => {
    if(err) {
    throw err;
    } else {
    setRemoveValue(res);
    }
  });

  // loops through all employees, joins them as a single string, pushes to an array, then presents that array as choices for inquirer prompt
  const setRemoveValue = (value) => {
    remChoices = value;

    remChoices.forEach(choice => {
      fullName = `${choice.first_name} ${choice.last_name}`;
      joinedRemChoices.push(fullName);
    });

    inquirer.prompt([
      {
        name: "employeeRemove",
        type: "rawlist",
        message: "Which employee would you like to remove?",
        choices: joinedRemChoices,
      }
    ])
      .then((answer) => {
        // splits the previously joined string into individual words that serve as first and last name
        const splitAnswer = answer.employeeRemove.split(' ');
        const remFirstName = splitAnswer[0];
        const remLastName = splitAnswer[1];
        // removes employee from db where there is a name match - it would probably be better (less error prone) to delete by id in case there are employees with identical names
        connection.query(`DELETE FROM employee WHERE first_name = ? AND last_name = ?`, [remFirstName, remLastName] , (err, res) => {
          if(err) {
          throw err;
          } else {
          console.log(`${remFirstName} ${remLastName} has been removed.`);
          loadPrompts();
          }
        });
    });
  }
}

const updEmployeeRole = () => {
  let updEmplChoices = [];
  let roleChoices = [];

  // queries first and last name from employee table
  connection.query("SELECT employee.first_name, employee.last_name FROM employee", (err, res) => {
    if(err) {
    throw err;
    } else {
    setUpdValue(res);
    }
  });

  // loops through data from mysql query, pushes it to array, displays that array as choices for which employee to udpate
  const setUpdValue = (value) => {
    value.forEach(choice => {
      fullName = `${choice.first_name} ${choice.last_name}`;
      updEmplChoices.push(fullName);
    });

    inquirer.prompt([
      {
        name: "employeeUpd",
        type: "rawlist",
        message: "Which employee would you like to update?",
        choices: updEmplChoices,
      },
    ])
      .then((answer) => {
        // queries employee's role id's and titles associated with those role id's to display as choices for inquirer'
        let chosenName = answer.employeeUpd.split(' ');
        connection.query("SELECT role.title FROM employee INNER JOIN role ON role.id = employee.role_id GROUP BY role.id", (err, res) => {
          if(err) {
          throw err;
          } else {
            setRoleValue(res);
          }
        });

        // loops through data from mysql query, pushes to an array, uses that array as choices in inquirer prompt
        const setRoleValue = (value) => {
          value.forEach(choice => {
            roleChoices.push(choice.title);
          });
      
          inquirer.prompt([
            {
              name: "roleUpd",
              type: "rawlist",
              message: "What is this employee's new role?",
              choices: roleChoices,
            },
          ])
            .then((answer) => {
              // finds the matching role id for the chosen role
              connection.query(`SELECT role.id FROM role WHERE ?`, { title: answer.roleUpd } , (err, res) => {
                if (err) {
                throw err;
                } else {
                  // updates that employee's role id with the id sources from above where there is a name match
                  connection.query("UPDATE employee SET ? WHERE first_name = ? AND last_name = ?", [{ role_id: res[0].id }, chosenName[0], chosenName[1]], (err, res) => {
                    if(err) {
                    throw err;
                    } else {
                      console.log(`${chosenName.join(' ')}'s role has been updated.`)
                      loadPrompts();
                    }
                  });
                }
              });
          });
        }
    });
  }
}

connection.connect((err) => {
    if (err) throw err;
    console.log(`Connected as id ${connection.threadId}`);
    loadPrompts()
});