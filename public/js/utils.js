const file_input = document.getElementById("file_input");
const send_btn = document.getElementById("process_form");
const reset_btn=document.getElementById("reset_form");
const form = document.forms["form_info"];
const status_button=document.getElementById('process_status');
const process_info=document.getElementById('process_info');
const process_info_text=document.getElementById('process_info_text');

//file handling
file_input.addEventListener(
  "change",
  function (e) {
    var file = this.files[0];
    if (file) {
      file_name.innerText = file.name;
      var reader = new FileReader();
      reader.onload = function (evt) {
        if (evt.target.result.length === 0) {
          alert("empty file provided");
          return false;
        }

        let array_url = evt.target.result.trim().split("\n");

        //storing file data in array format to the form
        form["file_input_data"].value = array_url;
        console.log("File Read [OK]");
      };

      reader.onerror = function (evt) {
        alert("An error ocurred reading the file", evt);
        return;
      };

      reader.readAsText(file, "UTF-8");
    }
  },
  false
);

reset_btn.addEventListener('click',function(evt){
    evt.preventDefault();
    window.location.pathname='';
});

//on form submission
//TODO: ERROR handling (user friendly)
form.addEventListener("submit", async function (evt) {
  evt.preventDefault();
  let url_input = form["urls_input"];
  let file_input = form["file_input"];
  let view_width = form["view_width"];
  let view_height = form["view_height"];

  if(view_width<50 || view_height<50){
    alert("view port width and height has to be greater than 50\n keep it empty for full/default viewport");
    return;
  }

  if (url_input.value.length === 0 && file_input.value.length === 0) {
    alert("no input provided");
    return;
  }

  //prefer file input over textarea input
  if (file_input.value.length > 0) {
    form.submit();
    reset_btn.setAttribute('disabled','');
    status_button.removeAttribute('class');
    status_button.setAttribute('uk-spinner','');
    send_btn.setAttribute('disabled','');
    process_info_text.innerText='🏄 Request Processing! Just sit back and relax';
    process_info.style.display='block';
    return;
  }

  form.submit();
  status_button.setAttribute('uk-spinner','');
  reset_btn.setAttribute('disabled','');
  status_button.removeAttribute('class');
  send_btn.setAttribute('disabled','');
  process_info_text.innerText='🏄 Request Processing! Just sit back and relax';
  process_info.style.display='block';
});

function showStat(){
  process_info_text.innerText='🗃️ File ready to download. Scroll down to download ⬇️';
  process_info.style.display='block';
}

