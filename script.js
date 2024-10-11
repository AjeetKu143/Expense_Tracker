// Variables for DOM elements
const itemInput = document.getElementById('item');
const amountInput = document.getElementById('amount');
const addExpenseButton = document.getElementById('addExpense');
const expenseList = document.getElementById('expenseList');
const totalAmountDisplay = document.getElementById('totalAmount');
const exportExcelButton = document.getElementById('exportExcel');
const expenseChartCanvas = document.getElementById('expenseChart');

// Initial data
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let totalAmount = calculateTotal();
let showAllExpenses = false; // Track if all expenses are shown
let expenseChart; // Chart instance

// Get today's date in 'YYYY-MM-DD' format
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Add expense function (Automatically set the current date)
addExpenseButton.addEventListener('click', function() {
    const date = getCurrentDate(); // Automatically get today's date
    const item = itemInput.value;
    const amount = parseFloat(amountInput.value);

    if (item && amount) {
        const expense = { date, item, amount, id: Date.now() }; // id is the timestamp to track when added
        expenses.push(expense);
        updateLocalStorage();

        // Show recent expenses first after adding data
        displayExpenses();
        updateTotal();
        updateChart();
        clearInputs();
    }
});

// Display expenses sorted by most recently added (last added first)
function displayExpenses() {
    expenseList.innerHTML = '';

    // Sort expenses by 'id' (most recently added first)
    expenses.sort((a, b) => b.id - a.id);

    // Show recent 3 expenses or all if toggled
    let displayedExpenses = showAllExpenses ? expenses : expenses.slice(0, 3);

    displayedExpenses.forEach(expense => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="expense-item">
                <div>${expense.date}</div>
                <div>${expense.item}</div>
                <div>$${expense.amount.toFixed(2)}</div>
            </div>
            <button onclick="removeExpense(${expense.id})">Remove</button>
        `;
        expenseList.appendChild(li);
    });

    // Add 'Show more' or 'Show less' button if expenses are more than 3
    if (expenses.length > 3) {
        const toggleButton = document.createElement('button');
        toggleButton.innerText = showAllExpenses ? 'Show Less' : 'Show More';
        toggleButton.addEventListener('click', toggleExpenseList);
        expenseList.appendChild(toggleButton);
    }
}

// Function to toggle the display between showing 3 and all expenses
function toggleExpenseList() {
    showAllExpenses = !showAllExpenses;
    displayExpenses();
}

// Remove expense
function removeExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    updateLocalStorage();
    displayExpenses();
    updateTotal();
    updateChart();
}

// Calculate and update total amount
function calculateTotal() {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
}

function updateTotal() {
    totalAmount = calculateTotal();
    totalAmountDisplay.innerText = totalAmount.toFixed(2);
}

// Update localStorage after modifying expenses
function updateLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Clear form inputs
function clearInputs() {
    itemInput.value = '';
    amountInput.value = '';
}

// Initialize app
function init() {
    displayExpenses();
    updateTotal();
    updateChart();
}

// Function to generate monthly expense chart
function updateChart() {
    const ctx = expenseChartCanvas.getContext('2d');

    // Aggregate expenses by date
    const dailyExpenses = {};
    expenses.forEach(expense => {
        const day = new Date(expense.date).toLocaleDateString('default', { month: 'short', day: 'numeric' });
        if (!dailyExpenses[day]) {
            dailyExpenses[day] = 0;
        }
        dailyExpenses[day] += expense.amount;
    });

    // Data for the chart
    const labels = Object.keys(dailyExpenses).reverse(); // Reverse to show newest first
    const data = Object.values(dailyExpenses).reverse(); 

    // Destroy the previous chart instance if it exists
    if (expenseChart) {
        expenseChart.destroy();
    }

    // Create new chart
    expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses',
                data: data,
                backgroundColor: '#4cae4c',
                borderColor: '#5cb85c',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
    exportExcelButton.addEventListener('click', function() {
        // Create a new array excluding the 'id' property
        const expensesWithoutId = expenses.map(({ id, ...rest }) => rest);

        // Sort expenses by date before exporting (oldest first)
        expensesWithoutId.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Debug: Log sorted expenses
        console.log(expensesWithoutId);

        const worksheet = XLSX.utils.json_to_sheet(expensesWithoutId);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
        XLSX.writeFile(workbook, 'expenses.xlsx');
    });


// Call init on load
init();
