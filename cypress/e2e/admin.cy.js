describe('Admin page functional tests', () => {
	it('performs various admin page operations', () => {

		// login
		cy.visit('http://localhost:3000') //address
		cy.contains('p', 'Agree and sign on with zID').click() 
		cy.get('input[placeholder="zID"]').type('z2'); 
		cy.get('input[placeholder="Password"]').type('b'); 
		cy.get('button[type="submit"]').contains('Submit').click(); 


		// main page function
		cy.contains('button', 'Appointment numbers').click(); 
		cy.contains('button', 'Classroom numbers').click();
		cy.contains('button', 'User numbers').click(); 

		cy.contains('button', 'User management').click(); 
		cy.get('input[placeholder="Please input user zid"]').click().type('z82918'); 
		cy.get('.search-button').click(); 


		cy.contains('button', 'Classroom management').click(); 
		cy.get('select').select('meeting_room'); 

		cy.get('input[placeholder="Please input room name or level"]').clear().type(
		'103'); 
		cy.get('.search-button').click();
		cy.get('.table-button-2').click(); 
		cy.get('.table-button-2 img[alt="enable"]').should('exist');
		
		cy.visit('http://localhost:3000/admin');
		cy.contains('button', 'Classroom management').click(); 
		cy.get('select').select('meeting_room'); 
		cy.get('input[placeholder="Please input room name or level"]').clear().type(
		'113'); 
		cy.get('.table-button-2').click(); 
		cy.get('.table-button').click(); 

		cy.get('.edit-button').click(); //change information
		cy.get('input[name="capacity"]').clear().type('99'); 
		cy.contains('button', 'OK').click(); 
		cy.wait(2000);
		cy.get('span[class="arco-icon-hover arco-notification-icon-hover arco-notification-close-btn"]',{timeout:3000}).click();
		
		// comment function
		cy.get('textarea[placeholder="Add a comment..."]').type('Great!'); //add comment
		cy.contains('button', 'Comment').click(); 

		cy.contains('span.custom-comment-action', 'Reply').click(); //reply comment
		cy.get('input[placeholder="Input your content."]').click();
		cy.get('input[placeholder="Input your content."]').type('thankyou');
		cy.contains('button', 'Reply').click(); 


		cy.contains('span.custom-comment-action', 'Edit').click(); //edit comment
		cy.get('input[placeholder="Input your content."]').click();
		cy.get('input[value="11"]').clear().type('22');
		cy.contains('button', 'Submit').click();

		cy.contains('span.custom-comment-action', 'Delete').click(); //delect comment
		cy.contains('button.popup-button', 'Confirm').click(); //点击confilm
		cy.get('button.custom-comment-action').contains('svg.arco-icon-heart-fill').click(); //like comment

		// map function
		cy.get('div.to-map-container > a.to-map-link').click(); 
		cy.get('#location-select').select('A-K17-L2'); 
		cy.get('a.back-button').click(); 

		// Appointment Management
		cy.contains('button', 'Appointment management').click(); 
		cy.get('input.arco-picker-start-time')
	.click(); 
		cy.contains('div.arco-picker-date-value', '31').click(); 

		cy.get('.pending-booking-requests').click() //Pending Booking Requests
		cy.get('button.table-button img[alt="delete"]').click(); 
		cy.get('button.table-button img[alt="approve"]').click(); 

		// report function
		cy.contains('button', 'Statistics').click(); 
		cy.get('input[placeholder="Select date"]').click(); 
		cy.get('.arco-picker').should('be.visible');
		cy.contains('div.arco-picker-date-value', '29').click(); 
		cy.contains('a', 'Download Report').click(); //下载


		// Notifications
		cy.get('button.admin-notification').find('img[alt="Notifications"]')
	.click(); //need to wait a while or manual click


		// chatbox

		cy.get('button.admin-message').find('img[alt="Message"]').click(); 
		cy.contains('span.user-item-name', 'z82918 lnczb').click();
		cy.get('input.message-input').should('not.be.disabled').click().type(
			'Hello, how can I help you?'); 
		cy.get('img.vector[alt="Send"]').click(); 
		cy.get('button.calendar-button').find('img[alt="Calendar"]').click(); 
		cy.get('div.react-datepicker__day--029').click(); 
		cy.get('img[alt="Rectangle"]').parent().click(); 


		cy.get('button.admin-user').find('img[alt="User"]').click(); 
		cy.get('button.open-dropdown').click(); 
		cy.contains('button', 'Logout').click();


	})
})