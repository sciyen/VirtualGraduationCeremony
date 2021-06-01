$(document).ready(function () {
    $("#input-role").change(() => {
        const choice = $("#input-role").val();
        if (choice == "none") {
            $("#block-teachers").addClass("hide");
            $("#block-students").addClass("hide");
        }
        else if (choice == "students") {
            $("#block-teachers").addClass("hide");
            $("#block-students").removeClass("hide");
        }
        else if (choice == "teachers") {
            $("#block-teachers").removeClass("hide");
            $("#block-students").addClass("hide");
        }
    })
    $("form#login-form").submit((event)=>{
        event.preventDefault();
        var formData = $("form#login-form").serialize();
        //$('input#input-pswd').val(md5(formData['passwd']))
        //$('input#input-teacher-pswd').val(md5(formData['teacher-passwd']))
        $.get({
            url:'/login', 
            data:$("form#login-form").serialize(),
            success: (data)=>{
                console.log(data);
                if (data == 'ok')
                    window.location.replace('/content.html')
                else
                    alert(data);
            }
        })
    })
});
