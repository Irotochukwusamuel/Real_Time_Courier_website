$(document).ready(function () {

    let body = $("body");

    let tracker = body.find("[tracker]");
    let contactform = body.find("[contact_form]");


    function setCookie(name, value) {
        document.cookie = '' + name + '=' + value + '';
    }


    tracker.on("submit", function (e) {
        let track_input = tracker.find("[track_input]").val().trim();
        e.preventDefault();
        let form = new FormData(this);
        $.ajax({
            url: '/accessProduct',
            type: "POST",
            data: form,
            contentType: false,
            cache: false,
            processData: false,
            success: function (data) {
                if (data === 'exist') {
                    setCookie("track_id", track_input + "###");
                    setCookie("client_id", "admin");

                    window.location = "/shipment";
                } else if (data === 'not-exist') {
                    swal("Failed!", "Invalid Track ID", "error");
                }

            }
        })


    });

    contactform.on("submit", function (e) {
        e.preventDefault();
        let form = new FormData(this);
        $.ajax({
            url: '/contact-message',
            type: "POST",
            data: form,
            contentType: false,
            cache: false,
            processData: false,
            success: function (data) {
                if (data === 'success') {
                    swal("Sent!", "Your message has been sent successfully!", "success");
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                } else {
                    swal("Failed!", "message failed", "error");
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                }

            }
        })


    });


});