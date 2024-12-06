export function setupOrderButton(objectsToCustomize, objectMap) {
    const btnOrder = document.getElementById('order-button');
    if (btnOrder) {
        btnOrder.addEventListener('click', () => {
            const orderDetails = {};

            // Loop through all customizable objects
            objectsToCustomize.forEach((objectName) => {
                const object = objectMap[objectName];
                if (object) {
                    orderDetails[objectName] = {
                        color: `#${object.material.color.getHexString()}`, // Hex color
                        texture: object.material.map ? object.material.map.image.src : 'None', // Texture source or 'None'
                    };
                }
            });

            // Output the data to the console or on the page
            console.log('Order Details:', orderDetails);

            // Show the data in a <pre> element (optional)
            const orderOutput = document.getElementById('order-output');
            if (orderOutput) {
                orderOutput.textContent = JSON.stringify(orderDetails, null, 2);
            }

            // Send the order data to the backend
            fetch("https://api-f9me.onrender.com/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "customizations": orderDetails,
                })
            })
            .then(response => response.json())
            .then(data => {
                // Handle the response (success or error)
                if (data.status === 'Order successful') {
                    console.log('Order saved successfully in database');
                    alert('Your order has been placed successfully!');
                } else {
                    console.log('Failed to save order', data);
                    alert('There was an issue placing your order. Please try again.');
                }
            })
            .catch(error => {
                console.log('Error:', error);
                alert('There was a network error. Please try again later.');
            });
        });
    }
}
