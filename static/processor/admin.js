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
    };

    let signup = () => {
        let signup_form = body.find("[signup_form]");

        signup_form.on("submit", function (e) {
            e.preventDefault();
            let form = new FormData(this);
            $.ajax({
                url: '/admin_login',
                type: "POST",
                data: form,
                contentType: false,
                cache: false,
                processData: false,
                success: function (data) {
                    if (data === 'success') {
                        setCookie("track_id", "admin");
                        setCookie("user", "adminxxx");

                        window.location = "/chigozie";
                    } else if (data === 'failed') {
                        swal("Failed!", "Username or Password is not correct!", "error");
                    }

                }
            });
        });


    };


    let admin_script_run = () => {
        let show_add_user_form = body.find("[show_add_user_form]");
        let add_user_form = body.find("[add_user_form]");
        let update_route_form = body.find("[update_route_form]");
        let add_alert_form = body.find("[add_alert_form]");

        let close_add_user_form = add_user_form.find("[close_add_user_form]");
        let close_update_form = update_route_form.find("[close_add_user_form]");
        let close_alert_form = add_alert_form.find("[close_add_user_form]");

        let add_ticket = add_user_form.find("[add_ticket]");
        let update_route = update_route_form.find("[update_route]");
        let update_alert = add_alert_form.find("[update_alert]");
        let distance_toggle = body.find("[distance_toggle]");
        let admin = body.find("[admin]");


        let chat_container = admin.find("[chat_container]");
        let chat_opener = body.find("[chat_opener]");
        let chatroom = chat_container.find("[chatroom]");
        let chat_list = chat_container.find("[chat_list]");
        let chat_box = chat_container.find("[chat_box]");
        let user_chat = chat_box.find("[user_chat]");
        let workstream = chat_container.find("[workstream]");
        let backBTN = workstream.find("[backBTN]");
        let mobile_btn = chat_list.find("[mobile_btn]");
        let Chat_add_image = workstream.find("[add_image]");
        let update_routeBTN = body.find("[update_routeBTN]");
        let add_alertBTN = body.find("[add_alertBTN]");


        mobile_btn.on("click", function () {
            chat_opener.removeClass("active ri-close-line").addClass("ri-chat-3-line");
            chat_container.fadeOut("300");
            admin.css("z-index", "-1");
            body.css("overflow", "auto");

        });

        let loadChatList = () => {
            chat_box.empty();
            $.ajax({
                url: '/chatlist',
                type: "POST",
                contentType: false,
                data: false,
                cache: false,
                processData: false,
                success: function (data) {
                    let res = data["data"];
                    if (res !== "empty") {
                        for (const msg in res) {
                            if (res.hasOwnProperty(msg)) {
                                let result = res[msg];

                                let message = "";
                                if (result["type"] === "text") {
                                    message += `
                                 <div class="box" user_chat="${result['id']}">
                                 <p class="name">${result["name"]}</p>
                                <p class="msg">${result["msg"]}</p>
                                  </div>`
                                } else if (result["type"] === "image") {
                                    message += `
                                 <div class="box" user_chat="${result['id']}">
                                 <p class="name">${result["name"]}</p>
                                <p class="msg">Photo</p>
                                  </div>`
                                }

                                chat_box.append(message);
                            }
                        }
                    } else {
                        return false;
                    }
                }
            })
        }

        chat_box.on("click", "[user_chat]", function () {
            let name = workstream.find("[chatName]");
            setCookie("client_id", $(this).attr("user_chat"));
            let clientID = readCookie("client_id");
            $(this).parents(".chat_list").css("display", "none");
            workstream.css("display", "grid");
            name.text($(this).find(".name").text());

            fetch_user_chats(clientID);
            let stream = new EventSource('/LastMessage');
            let listen_message = (clientID) => {
                stream.onmessage = function (data) {
                    console.log(data)
                    let dataobj = JSON.parse(data.data);
                    for (const msg in dataobj) {
                        if (dataobj.hasOwnProperty(msg)) {
                            let result = dataobj[msg];
                            console.log(result)
                            let user = {
                                "user": clientID
                            }

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
                                receiveSound();
                                chat_scrollBottom();
                            }
                        }
                    }


                }

            };
            listen_message(clientID);

        });

        backBTN.on("click", function () {
            $(this).parents(".workstream").css("display", "none");
            chat_list.css("display", "block");
        });

        distance_toggle.on("change", function () {
            let track_ID = $(this).parents("tr").attr("row_id");
            let data = {
                distance: $(this).val(),
                track_ID: track_ID
            };
            $.ajax({
                url: '/distance',
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(data),
                cache: false,
                processData: false,
                success: function (data) {
                    if (data === 'success') {
                        swal("SET!", "Destination set successfully", "success");
                    }
                }
            })

        });

        add_ticket.on("submit", function (e) {
            e.preventDefault();
            let form = new FormData(this);
            $.ajax({
                url: '/addticket',
                type: "POST",
                data: form,
                contentType: false,
                cache: false,
                processData: false,
                success: function (data) {
                    if (data === 'success') {
                        swal({
                            title: "Added!",
                            text: "Ticket has been added successfully",
                            type: "success"
                        }).then(okay => {
                            if (okay) {
                                window.location = "/chigozie";
                            }
                        });
                    } else {
                        swal("failed!", "failed to add ticket", "error");
                    }

                }
            })


        });

        update_route.on("submit", function (e) {
            e.preventDefault();
            let form = new FormData(this);
            $.ajax({
                url: '/update-route',
                type: "POST",
                data: form,
                contentType: false,
                cache: false,
                processData: false,
                success: function (data) {
                    if (data === 'success') {
                        swal({
                            title: "Added!",
                            text: "Route has been Updated successfully",
                            type: "success"
                        }).then(okay => {
                            if (okay) {
                                window.location = "/chigozie";
                            }
                        });
                    } else {
                        swal("failed!", "failed to add ticket", "error");
                    }

                }
            })


        });

        update_alert.on("submit", function (e) {
            e.preventDefault();
            let form = new FormData(this);
            $.ajax({
                url: '/update-alert',
                type: "POST",
                data: form,
                contentType: false,
                cache: false,
                processData: false,
                success: function (data) {
                    if (data === 'success') {
                        swal({
                            title: "Added!",
                            text: "Alert has been Updated successfully",
                            type: "success"
                        }).then(okay => {
                            if (okay) {
                                window.location = "/chigozie";
                            }
                        });
                    } else {
                        swal("failed!", "failed to add ticket", "error");
                    }

                }
            })


        });

        show_add_user_form.on("click", function () {
            add_user_form.css("display", "flex");
        });

        update_routeBTN.on("click", function () {
            let track_ID = $(this).parents("tr").attr("row_id");
            setCookie("crx", track_ID);
            update_route_form.css("display", "flex");
        });

        add_alertBTN.on("click", function () {
            let track_ID = $(this).parents("tr").attr("row_id");
            setCookie("crx", track_ID);
            add_alert_form.css("display", "flex");
        });

        close_update_form.on("click", function () {
            update_route_form.css("display", "none");
        });

        close_add_user_form.on("click", function () {
            add_user_form.css("display", "none");
        });

        close_alert_form.on("click", function () {
            add_alert_form.css("display", "none");
        });


        chat_opener.on("click", function () {
            let $this = $(this);

            if (!$this.hasClass("active")) {
                $this.removeClass("ri-chat-3-line").addClass("active ri-close-line");
                chat_container.fadeIn("300");
                admin.css("z-index", "6");
                body.css("overflow", "hidden");
                loadChatList();
            } else {
                $this.removeClass("active ri-close-line").addClass("ri-chat-3-line");
                chat_container.fadeOut("300");
                admin.css("z-index", "-1");
                body.css("overflow", "auto");


            }

        });

        let chat_scrollBottom = () => {
            return chatroom.stop().animate({scrollTop: chatroom[0].scrollHeight}, 1000);
        }


        let fetch_user_chats = (clientID) => {
            chatroom.empty();
            let d_data = {
                "id": readCookie("track_id"),
                "user": clientID
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


                            } else if (result["senderID"] === clientID) {
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
                    let clientID = readCookie("client_id");
                    let data = {
                        "id": readCookie("track_id"),
                        "receiver": clientID,
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
                        let clientID = readCookie("client_id");
                        let image_data = this.result.replace("data:" + file.type + ";base64,", '');

                        let data = {
                            "id": readCookie("track_id"),
                            "receiver": clientID,
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

    signup();

    admin_script_run();


});