$(document).ready(function () {

    let body = $("body");


    function setCookie(name, value) {
        document.cookie = '' + name + '=' + value + '';
    }


    function readCookie(name) {
        let nameEQ = name + "=";
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }


    function receiveSound() {
        let url = "http://" + location.host + "/static/sound/recieve.mp3"
        const audio = new Audio(url);
        audio.play();
    }

    function sendSound() {
        let url = "http://" + location.host + "/static/sound/send.mp3"
        const audio = new Audio(url);
        audio.play();
    }

    /* 1. Proloder */
    $(window).on('load', function () {
        $('#preloader-active').delay(450).fadeOut('slow');
        $('body').delay(450).css({
            'overflow': 'visible'
        });
    });

    //client side script
    let mini_chat_toggler = () => {
        let client_side = body.find("[client_side]");
        let chat_container = client_side.find("[chat_container]");
        let chat_opener = body.find("[chat_opener]");
        let chatroom = chat_container.find("[chatroom]");
        let Chat_add_image = chat_container.find("[add_image]");

        let mobile_btn = client_side.find("[mobile_btn]");


        mobile_btn.on("click", function () {
            chat_opener.removeClass("active ri-close-line").addClass("ri-chat-3-line");
            chat_container.fadeOut("300");
            client_side.css("z-index", "-1");
            body.css("overflow", "auto");

        });


        chat_opener.on("click", function () {
            let $this = $(this);


            if (!$this.hasClass("active")) {
                $this.removeClass("ri-chat-3-line").addClass("active ri-close-line");
                chat_container.fadeIn("300").css("display", "grid");
                fetch_user_chats();
                client_side.css("z-index", "6");
                body.css("overflow", "hidden");


                let message = "";
                message += `
                <div class="others">
                    <div class="message">
                        <p class="text">Hello Dear,<br> My name is James and am your customer support. how can i help you today?</p>
                    </div>
                 </div>`
                chatroom.append(message);


            } else {
                $this.removeClass("active ri-close-line").addClass("ri-chat-3-line");
                chat_container.fadeOut("300");
                client_side.css("z-index", "-1");
                body.css("overflow", "auto");

            }

            let stream = new EventSource('/LastMessage');
            let listen_message = () => {
                stream.onmessage = function (data) {
                    let dataobj = JSON.parse(data.data);
                    let user = {
                        "user": "admin"
                    }
                    for (const msg in dataobj) {
                        if (dataobj.hasOwnProperty(msg)) {
                            let result = dataobj[msg];

                            if (result["delivered"] === false) {
                                let message = "";


                                if (result["type"] === "text") {
                                    message += `
                                                <div class="others">
                                                    <div class="message">
                                                        <p class="text">${result["message"]}</p>
                                                    </div>
                                                 </div>`
                                } else if (result["type"] === "image") {
                                    message += `
                                         <div class="others">
                                            <div class="message">
                                                <img class="msg-img" src=${result["path"] + '/' + result["message"]}>
                                            </div>
                                         </div>`
                                }
                                $.ajax({
                                    url: '/deliveredMessage',
                                    type: "POST",
                                    contentType: "application/json",
                                    data: JSON.stringify(user),
                                    cache: false,
                                    processData: false,
                                    success: function (data) {

                                    }
                                });
                                chatroom.append(message);
                                chat_scrollBottom();
                                receiveSound();
                            }
                        }
                    }


                }
            };
            listen_message();

        });

        let chat_scrollBottom = () => {
            return chatroom.stop().animate({scrollTop: chatroom[0].scrollHeight}, 1000);
        }

        let fetch_user_chats = () => {
            chatroom.empty();

            let d_data = {
                "id": readCookie("track_id"),
                "user": "admin"
            }
            $.ajax({
                url: '/fetchMessages',
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(d_data),
                cache: false,
                processData: false,
                success: function (data) {
                    let res = data["data"];
                    for (const msg in res) {
                        if (res.hasOwnProperty(msg)) {
                            let result = res[msg];
                            let message = "";
                            if (result["senderID"] === readCookie("track_id")) {

                                if (result["type"] === "text") {
                                    message += `  
                                     <div class="me">
                                        <div class="message">
                                            <p class="text">${result["message"]}</p>
                                        </div>
                                     </div>`
                                } else if (result["type"] === "image") {
                                    message += `
                                         <div class="me">
                                            <div class="message">
                                                <img class="msg-img" src=${result["path"] + '/' + result["message"]}>
                                            </div>
                                         </div>`
                                }


                            } else if (result["senderID"] === "admin") {
                                if (result["type"] === "text") {
                                    message += `
                                                <div class="others">
                                                    <div class="message">
                                                        <p class="text">${result["message"]}</p>
                                                    </div>
                                                 </div>`
                                } else if (result["type"] === "image") {
                                    message += `
                                         <div class="others">
                                            <div class="message">
                                                <img class="msg-img" src=${result["path"] + '/' + result["message"]}>
                                            </div>
                                         </div>`
                                }


                            }
                            chatroom.append(message);
                            chat_scrollBottom();

                        }
                    }
                }
            })
        }

        let send_message = () => {
            let msg_input = chat_container.find("[msg_input]");
            let msg_sendBtn = chat_container.find("[msg_sendBtn]");

            msg_input.on("click", function () {
                $(this).removeClass("active");
            });
            msg_input.on("keyup", function () {
                let $this = $(this);
                if ($this.text().length <= 0) {
                    $this.addClass("active");
                } else {
                    $this.removeClass("active");
                }
            });
            msg_sendBtn.on("click", function () {
                if (!msg_input.text().length <= 0) {
                    let data = {
                        "id": readCookie("track_id"),
                        "receiver": "admin",
                        "message": msg_input.text(),
                        "type": "text"
                    };
                    $.ajax({
                        url: '/sendMessage',
                        type: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(data),
                        cache: false,
                        processData: false,
                        success: function (data) {
                            if (data === "success") {
                                msg_sendBtn.prop("disabled", false);
                                let message = "";
                                message += `
                             <div class="me">
                                <div class="message">
                                    <p class="text">${msg_input.text()}</p>
                                </div>
                             </div>`
                                chatroom.append(message);
                                chat_scrollBottom();
                                msg_input.text("").addClass("active");
                                sendSound();

                            }
                        }
                    });
                } else {
                    return false;
                }


            });


            Chat_add_image.on("change", function () {
                if (this.files) $.each(this.files, readAndPreview);

                function readAndPreview(i, file) {
                    if (!/\.(jpe?g|png|gif)$/i.test(file.name)) {
                        return alert(file.name + "is not an image");
                    }
                    let reader = new FileReader();

                    $(reader).on("load", function () {
                        let clientID = "admin";
                        let image_data = this.result.replace("data:" + file.type + ";base64,", '');
                        let data = {
                            "id": readCookie("track_id"),
                            "receiver": "admin",
                            "message": image_data,
                            "image_type": file.type,
                            "type": "image"
                        };
                        $.ajax({
                            url: '/sendMessage',
                            type: "POST",
                            contentType: "application/json",
                            data: JSON.stringify(data),
                            cache: false,
                            processData: false,
                            success: function (data) {
                                if (data === "success") {
                                    chatroom.append(`
                                         <div class="me">
                                            <div class="message">
                                                <img class="msg-img" src="${reader.result}">
                                            </div>
                                         </div>`
                                    );
                                    msg_sendBtn.prop("disabled", false);
                                    msg_input.text("").addClass("active");
                                }
                            }
                        });


                    });
                    reader.readAsDataURL(file);
                    chat_scrollBottom();
                    sendSound();
                }


            });


            let Enter_event = () => {
                msg_input.on("keyup", function (e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        msg_sendBtn.click();
                    }
                })
            }

            Enter_event();

        };

        send_message();


    };

    mini_chat_toggler();

    let map_geolocation = () => {

        mapboxgl.accessToken = 'pk.eyJ1IjoiY2xhaXJibGFpciIsImEiOiJja3hna2JjYXUwdTVpMnZucDJxbTZwYzNjIn0.6MANn4FnUHVIDnTJWGXOwg';
        const map = new mapboxgl.Map({
            container: "user_map",
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            zoom: 3
        });



        map.on('load', function () {
            var directions = new MapboxDirections({
                accessToken: mapboxgl.accessToken
            });

            map.addControl(directions, 'top-left');
            let origin_ = body.find("[origin_]").text();
            let destination = body.find("[destination_]").attr("destination_");
            directions.setOrigin(origin_);
            directions.setDestination(destination);
        });

        let right_side = body.find("[right_side]");
        let left_side = body.find("[left_side]");
        let middle_side = body.find("[middle_side]");
        let overview_ = body.find("[overview_]");
        let tracking_ = body.find("[tracking_]");

        overview_.on("click", function () {
            right_side.animate({
                left: "0"
            });
            left_side.animate({
                left: "-100%"
            });
        });
        tracking_.on("click", function () {
            left_side.animate({
                left: "0"
            });
            right_side.animate({
                left: "-100%"
            });
        });


        body.find("[show_more]").on("click", function () {
            if (!$(this).find("button").hasClass("ri-close-line show_more")) {
                $(this).find("button").removeClass("ri-menu-2-line show_more");
                $(this).find("button").addClass("ri-close-line show_more");
                $(this).find(".menu_").css("display", "flex");
            } else {
                $(this).find("button").removeClass("ri-close-line show_more");
                $(this).find("button").addClass("ri-menu-2-line show_more");
                $(this).find(".menu_").css("display", "none");
            }
        });

        middle_side.on("click", function () {
            left_side.animate({
                left: "-100%"
            });
            right_side.animate({
                left: "-100%"
            });
        })
    };

    let fetch_alert = () => {
        $.ajax({
            url: '/fetch-alert',
            type: "POST",
            data: "form",
            contentType: false,
            cache: false,
            processData: false,
            success: function (data) {
                console.log(data)
                if (data !== 'empty') {
                     swal("", data, "warning");
                }

            }
        })
    };


    setTimeout(function () {
        fetch_alert();

        map_geolocation();
    }, 1000)


});