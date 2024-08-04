describe('User Flow Test', () => {
  it('passes', () => {
    cy.visit('http://localhost:3000'); // address

    // login
    cy.contains('p', 'Agree and sign on with zID').click();
    cy.get('input[placeholder="zID"]').type('z11330');
    cy.get('input[placeholder="Password"]').type('qkUqk');
    cy.get('button[type="submit"]').contains('Submit').click();

    //rebook

    //booking
    cy.get('select[name="level"]').select('3');
    //cy.get('select[name="numberOfPeople"]', { timeout: 10000 }).should('be.visible').select('2');//选择2人
    //cy.get('input[role="spinbutton"]').type('2');
    cy.get('input[role="spinbutton"]').then(($input) => {
      const currentValue = $input.val();

      // enter the new value
      cy.wrap('2').as('newValue');
      cy.get('input').type('2');

      // Wait a while to simulate the user's actions
      cy.wait(1000);

      // Restore original value
      cy.get('input[role="spinbutton"]').clear().type('2');
    });
    cy.wait(1000);
    cy.get('select[name="category"]').select('meeting_room');
    cy.get('select[name="sort"]').select('default');
    cy.get('button[type="submit"]').contains('Submit').click();

    cy.get('#mytable', { timeout: 10000 }).should('be.visible'); // Ensure table loading
    cy.get('button.MuiButton-containedInfo').contains('Go to Date').click();
    const date = new Date();
    const formattedDate = date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const nowStr = formattedDate + ' 00:00:00';
    const newDate = new Date(nowStr);
    const desiredTimestamp = newDate.getTime();
    cy.get(`button[data-timestamp="${desiredTimestamp}"]`).click();

    //Room rating function
    cy.get('td.room-column').contains('302').click();
    cy.get('button').contains('Make Rate').click();
    cy.get('.arco-rate-character').last().click();
    cy.get('button[type="button"]').contains('Submit').click();
    cy.get('button').contains('Close').click();

    //report function
    cy.get('button').contains('Report').click();
    cy.get('textarea[placeholder="Enter report details"]').type(
      'Air conditioning not working'
    );
    cy.get('button[type="button"]').contains('OK').click();

    //comment function
    cy.get('input[placeholder="Add a comment..."]').type('This room is great!'); // add comment
    cy.get('button').contains('Comment').click();
    cy.get('span').contains('Edit').click();
    cy.get('input[class="edit-input"]').type('This room is great!'); // edit comment

    cy.get('button.custom-comment-action').first().click(); // like comment
    cy.get('span.custom-comment-action').contains('Reply').click();
    cy.get('input[placeholder="Input your content."]').type(
      'Thank you for your feedback!'
    );
    cy.get('button').contains('Submit').click();
    cy.get('button').contains('Comment').click();

    cy.get('button').contains('Submit').click();
    cy.get('span.custom-comment-action').contains('Delete').click(); // delect comment
    cy.get('button').contains('Delete').click();

    cy.get('img[alt="UNSW Logo"]').click(); // go back to the homepage

    // Chatbox
    cy.get('button.chat-toggle-button').within(() => {
      cy.get('img[alt="Chat"]').click();
    });

    // express booking function

    cy.get('.exchange-button').click();
    cy.get('textarea[placeholder="Type your message here..."]')
      .type('12:00-13:00 2024.07.30')
      .should('have.value', '12:00-13:00 2024.07.30');
    cy.get('.send-button-container .send-button').click();
    cy.contains('button', 'Select Room').click();
    cy.contains('button', 'Book Room').click();
    cy.url().should('include', '/expected-url-after-booking');

    cy.contains('button', 'Switch').click(); // change butten

    // customerservice function
    cy.get('textarea[placeholder="Type your message here..."]')
      .type('I want ask something about booking')
      .should('have.value', 'I want ask something about booking');
    cy.get('img.send-button').click();

    cy.get('button').contains('Close').click(); // cloose Chatbox

    // history function
    cy.get('button[alt="User"] img[src="/admin_img/user.png"]').click();
    cy.get('div[role="menuitem"]').contains('History').click();

    // Rebook
    cy.get('span').contains('Rebook').click();
    cy.get('.date-calendar-overlay').should('be.visible');
    cy.get('button[data-timestamp="1722348000000"]').click();
    cy.get('button').contains('Confirm').click();

    // cancle booking
    cy.get('div.arco-table-cell').contains('Cancel').click();

    cy.get('a').contains('UNSW').click(); // go back to the homepage

    // logout
    cy.get('button[alt="User"] img[src="/admin_img/user.png"]').click();
    cy.get('div[role="menuitem"]').contains('Logout').click();
  });
});
