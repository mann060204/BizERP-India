import re

def update_customer_routes():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/routes/customer.routes.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Import getCustomerLedger and recordPayment
    content = content.replace("createBulkCustomers } from '../controllers/customer.controller';", "createBulkCustomers, getCustomerLedger, recordPayment } from '../controllers/customer.controller';")

    # Add routes
    routes_to_add = "router.get('/:id/ledger', getCustomerLedger);\nrouter.post('/:id/payments', recordPayment);\n"
    content = content.replace("router.get('/:id', getCustomer);", "router.get('/:id', getCustomer);\n" + routes_to_add)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_customer_routes()
print("Updated customer routes!")
