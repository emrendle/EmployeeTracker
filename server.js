const mysql = require('mysql');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
  host: 'localhost',

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: 'root',

  // Be sure to update with your own MySQL password!
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
          }
        );
      });
      loadPrompts();
}

const remEmployee = () => {
  var choices = [];
  joinedChoices = [];

  connection.query("SELECT employee.first_name, employee.last_name FROM employee", (err, res) => {
    if(err) {
    throw err;
    } else {
    setValue(res);
    }
  });

  const setValue = (value) => {
    choices = value;

    choices.forEach(choice => {
      fullName = `${choice.first_name} ${choice.last_name}`;
      joinedChoices.push(fullName);
    });

    inquirer.prompt([
      {
        name: "employeeRemove",
        type: "rawlist",
        message: "Which employee would you like to remove?",
        choices: joinedChoices,
      }
    ])
      .then((answer) => {
        const splitAnswer = answer.employeeRemove.split(' ');
        const firstName = splitAnswer[0];
        const lastName = splitAnswer[1];
        // would be smartest to query for employee id, delete by id? check the syntax for the where? clause for this, idk if you can have multiple values??
        connection.query("DELETE FROM employee WHERE ?", { first_name: firstName, last_name: lastName, }, (err, res) => {
          if(err) {
          throw err;
          } else {
          console.log(`${firstName} ${lastName} has been removed.`);
          }
        });
    });
  }
  loadPrompts();
}

// view employees by department
// inqurier ask what department
// select * from employee left join role on employee.role_id = role.id left join deparment on role.department_id = deparment.id where department = ?
connection.connect((err) => {
    if (err) throw err;
    console.log(`Connected as id ${connection.threadId}`);
    loadPrompts()
});