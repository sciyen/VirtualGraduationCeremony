$(document).ready(function () {
    $("#input-role").change(() => {
        const choice = $("#input-role").val();
        console.log(choice)
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
});