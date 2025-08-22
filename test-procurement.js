// Test script for procurement APIs
const axios = require('axios');

const BASE_URL = 'http://localhost:3007/api/v1';

// Replace with your actual auth token
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testProcurementAPIs() {
  try {
    console.log('Testing Procurement APIs...\n');
    
    // 1. Test GET all procurement items
    console.log('1. Testing GET /procurement');
    try {
      const listResponse = await api.get('/procurement');
      console.log('✅ GET /procurement - Success');
      console.log(`   Found ${listResponse.data.data.length} items\n`);
    } catch (error) {
      console.log('❌ GET /procurement - Failed');
      console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
    }
    
    // 2. Test analytics endpoint
    console.log('2. Testing GET /procurement/analytics');
    try {
      const analyticsResponse = await api.get('/procurement/analytics');
      console.log('✅ GET /procurement/analytics - Success');
      console.log(`   Total items: ${analyticsResponse.data.data.summary.totalItems}`);
      console.log(`   Total cost: $${analyticsResponse.data.data.summary.totalCost}\n`);
    } catch (error) {
      console.log('❌ GET /procurement/analytics - Failed');
      console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
    }
    
    // 3. Test create procurement
    console.log('3. Testing POST /procurement');
    const testProcurement = {
      projectId: "test-project-id", // Replace with actual project ID
      materialItem: "Test Material Item",
      description: "Test description for procurement item",
      quantity: 10,
      unit: "pcs",
      unitPrice: 50.00,
      discipline: "Electrical",
      phase: "Construction",
      category: "MATERIALS",
      requiredBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      leadTimeDays: 14,
      priority: "MEDIUM"
    };
    
    try {
      const createResponse = await api.post('/procurement', testProcurement);
      console.log('✅ POST /procurement - Success');
      console.log(`   Created item with ID: ${createResponse.data.data.id}`);
      console.log(`   PO Number: ${createResponse.data.data.poNumber || 'N/A'}\n`);
      
      // Store ID for further tests
      const createdId = createResponse.data.data.id;
      
      // 4. Test GET single item
      console.log(`4. Testing GET /procurement/${createdId}`);
      try {
        const getResponse = await api.get(`/procurement/${createdId}`);
        console.log('✅ GET /procurement/[id] - Success');
        console.log(`   Material: ${getResponse.data.data.materialItem}`);
        console.log(`   Status: ${getResponse.data.data.orderStatus}\n`);
      } catch (error) {
        console.log('❌ GET /procurement/[id] - Failed');
        console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
      }
      
      // 5. Test update status
      console.log(`5. Testing PATCH /procurement/${createdId} (status update)`);
      try {
        const statusResponse = await api.patch(`/procurement/${createdId}`, {
          status: 'QUOTED'
        });
        console.log('✅ PATCH /procurement/[id] - Success');
        console.log(`   New status: ${statusResponse.data.data.orderStatus}\n`);
      } catch (error) {
        console.log('❌ PATCH /procurement/[id] - Failed');
        console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
      }
      
      // 6. Test approval
      console.log(`6. Testing POST /procurement/${createdId}/approve`);
      try {
        const approveResponse = await api.post(`/procurement/${createdId}/approve`, {
          action: 'approve',
          comments: 'Approved for testing'
        });
        console.log('✅ POST /procurement/[id]/approve - Success');
        console.log(`   Status: ${approveResponse.data.data.orderStatus}`);
        console.log(`   PO Number: ${approveResponse.data.data.poNumber}\n`);
      } catch (error) {
        console.log('❌ POST /procurement/[id]/approve - Failed');
        console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
      }
      
      // 7. Test delete (cleanup)
      console.log(`7. Testing DELETE /procurement/${createdId}`);
      try {
        const deleteResponse = await api.delete(`/procurement/${createdId}`);
        console.log('✅ DELETE /procurement/[id] - Success\n');
      } catch (error) {
        console.log('❌ DELETE /procurement/[id] - Failed');
        console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
      }
      
    } catch (error) {
      console.log('❌ POST /procurement - Failed');
      console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
    }
    
    // 8. Test bulk operations
    console.log('8. Testing POST /procurement/bulk');
    try {
      const bulkResponse = await api.post('/procurement/bulk', {
        ids: ['test-id-1', 'test-id-2'], // Replace with actual IDs
        operation: 'updatePriority',
        data: {
          priority: 'HIGH'
        }
      });
      console.log('✅ POST /procurement/bulk - Success');
      console.log(`   Updated ${bulkResponse.data.data.count} items\n`);
    } catch (error) {
      console.log('❌ POST /procurement/bulk - Failed');
      console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
    }
    
    // 9. Test export
    console.log('9. Testing GET /procurement/export');
    try {
      const exportResponse = await api.get('/procurement/export?format=csv');
      console.log('✅ GET /procurement/export - Success');
      console.log(`   Export format: CSV\n`);
    } catch (error) {
      console.log('❌ GET /procurement/export - Failed');
      console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
    }
    
    console.log('Testing complete!');
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
}

// Run tests
testProcurementAPIs();

console.log('\nNote: Make sure to replace AUTH_TOKEN and projectId with actual values before running.');
console.log('You can get the auth token from browser DevTools > Application > localStorage > idToken');
console.log('You can get a project ID from the projects list in the app.');