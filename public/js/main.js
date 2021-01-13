$(document).ready(function(){

    $(".book-block").on('click', function(){
        
        var bookid = $(this).attr("id").substr(4);
        window.location.href='/book/'+bookid+'';
    })

    $("#btnlog").on('click', function(){

        if($("#logemail").val()!=="" && $("#logpassword").val()!=="")
        {
            $.ajax({
                url:"/login",
                method: "POST",
                data: {email: $("#logemail").val(),
                password: $("#logpassword").val()},
                success: function(answer)
                {
                    if(answer=="Ошибка")
                    $("#error-login").html("Ошибка логина или пароля");
                    else
                    window.location.reload();
                }
            });
        }
        else
        {
            $("#error-login").html("Заполните поля");
        }
    });

    $("#btnreg").on('click', function(){

        if($("#regemail").val()!=="" 
        && $("#regpassword").val()!=="" 
        && $("#regpassword2").val()!==""
        && $("#regname").val()!==""
        && $("#regsurname").val()!=="")
        {
            
            if($("#regpassword").val()==$("#regpassword2").val())
            $.ajax({
                url:"/registration",
                method: "POST",
                data: {
                    email: $("#regemail").val(),
                    password:$("#regpassword").val(),
                    name: $("#regname").val(),
                    surname:$("#regsurname").val()
                },
                success: function(answer)
                {
                    if(answer=="Ошибка")
                    $("#error-registration").html("Пользователь существует");
                    else
                    window.location.reload();
                }
            });
            else
            $("#error-registration").html("Пароли не совпадают");
        }
        else
        {
            $("#error-registration").html("Заполните поля");
        }
    });

    $("#buybook").on('click', function(){

       

        $.ajax({
            url:"/buy",
            method: "POST",
            data: {bookid: window.location.href},
            success: function()
            {
                window.location.reload();
            }
        })
    });
});