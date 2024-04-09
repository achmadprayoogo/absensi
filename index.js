
/** -----------------Request To Server--------------- */
async function getData(URL) {
    try {
        const data = await fetch(URL);
        const json = await data.json();
        console.log(json)
        return json;
    } catch (error) {
        console.log("terjadi kesalahan fetch" + error);
        return error;
    }
}

async function fetchData(URL, method, bodyData) {
    try {
        
        const response = await fetch(URL, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body : JSON.stringify(bodyData)
        });
        
        
        const json = await response.json();
        console.log(json);
        return json;
    } catch (error) {
        console.error("Terjadi kesalahan fetch:", error);
        return error;
    }
}


async function getDataNames(tahunajaran, tingkat, idkelas, kelas, walikelas, tanggal, jam) {
    let result;

    const url = 'https://c3p7kf-3000.csb.app/data/names/';
    const params = new URLSearchParams({
        tahunajaran : tahunajaran,
        tingkat : tingkat,
        idkelas : idkelas,
        kelas : kelas,
        walikelas : walikelas,
        tanggal : tanggal,
        jam : jam
    });
    
    const fullUrl = `${url}?${params}`;

    const data = await fetch(fullUrl).catch(error => {
        console.error('Ada kesalahan:', error);
    });

    if (!data.ok) {
        throw new Error('Terjadi kesalahan saat mengambil data');
    }
    result = data.json();
    return result;
}
/**---------------------Manage DOM-------------------- */
function setJamList() {
    removeDropDownList("jam");
    removeDropDownList("tingkat-options");
    removeDropDownList("walikelas-options");

    const dataJam = ["Jam Ke-1","Jam Ke-2"];
    const date = new Date(document.getElementById("select-date").value);
    const currentDate = new Date();
    currentDate.setHours(7);
    currentDate.setMinutes(0);
    currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);
    const isNextDate = (date - currentDate) > 0;
    removeTableRow("table-body");
    if (isNextDate) {
        addNoNamesTableRow("table-body",`Tidak bisa mengabsen melebihi tanggal :\n ${currentDate.getDate()}-${currentDate.getMonth()}-${currentDate.getFullYear()} `);
    } else {
        addNoNamesTableRow("table-body",`Isi formulir diatas terlebih dahulu...`);
        addDropDownList("jam", dataJam);   
    }
}

async function setTingkatList() {
    removeDropDownList("tingkat-options");
    removeDropDownList("walikelas-options");

    removeTableRow("table-body");
    addNoNamesTableRow("table-body",`Isi formulir diatas terlebih dahulu...`);

    const dataTingkat = await getDataTingkat();

    addDropDownList("tingkat-options", dataTingkat);
};

function getSelectedTingkatOptions() {
    removeTableRow("table-body");
    addNoNamesTableRow("table-body",`Isi formulir diatas terlebih dahulu...`);

    var selectedText = getDropDownListSelectedById("tingkat-options");

    removeDropDownList("walikelas-options");

    var walikelasNames = getDataWalikelas(selectedText);

    addDropDownList("walikelas-options", walikelasNames);

    return selectedText;
};

async function getSelectedWalikelasOptions() {
    
    var selectedText = getDropDownListSelectedById("walikelas-options")
    console.log("Walikelas yang dipilih:", selectedText);

    const tableInfo = document.getElementById("info");
    tableInfo.classList.remove("table-container");
    tableInfo.classList.add("invisible");
    removeTableRow("table-info");

    removeTableRow("table-body");
    addNoNamesTableRow("table-body","Tunggu.....");
    var dataKelas = getDataKelasByWalikelasName(selectedText);
    var dataKelasNames = await getDataNames(
        dataKelas.tahunajaran, 
        dataKelas.tingkat, 
        dataKelas.idkelas, 
        dataKelas.kelas, 
        dataKelas.walikelas, 
        dataKelas.tanggal, 
        dataKelas.jam
        )

    console.log(dataKelasNames);

    removeTableRow("table-body");

    if (!dataKelasNames.message) {
        var arrayNames = dataKelasNames.data;
    
        for (let i = 0; i < arrayNames.length; i++) {
            const element = arrayNames[i];

            if (element.data_absensi == null) {
                addTableRow( i + 1, element.id, element.nama_lengkap, null);
                changeButtonText("Kirim");
            } else {
                addTableRow( i + 1, element.id, element.nama_lengkap, element.data_absensi.absensi);
                changeButtonText("Update");
            }
        }       

    } else {
        addNoNamesTableRow("table-body",dataKelasNames.message);
        changeButtonText("Hubungi Admin?");
    }    
}
 
async function buttonClicked() {
    const btn = document.getElementById("button");

    if (btn.textContent == "Hubungi Admin?") {
        window.location.href = 'https://wa.me/6285155001137';
    } else {
        const walikelas = getDropDownListSelectedById("walikelas-options");
        const tableInfo = document.getElementById("info");
        const nameCollumCells = document.querySelectorAll('.name-collum');

        const tahunajaran = json.tahunAjaranNow;
        const tanggal = document.getElementById("select-date").value;
        const jam = getDropDownListSelectedById("jam").substring(7);
        const idkelas = getDataKelasByWalikelasName(walikelas).idkelas;
        const dataabsen = [];
        const bodyData = {
            tahunajaran,
            tanggal,
            jam,
            idkelas,
            dataabsen,
        }
        
        let URL;
        let method;
        var isDataComplete = true;
        

        nameCollumCells.forEach(cell => {
            const id = cell.getAttribute('id');
            console.log('ID:', id);

            const selectedRadioButton = document.querySelector(`input[name="option${id}"]:checked`);

            if (selectedRadioButton) {
                const selectedValue = selectedRadioButton.value;
                dataabsen.push({id : id, absen : selectedValue});
                console.log("Radio button yang dipilih:", selectedValue);
            } else {
                isDataComplete = false;
                console.log("Tidak ada radio button yang dipilih");
            }
        });

        if (isDataComplete) {
            switch (btn.textContent) {
                case "Kirim":
                    URL = "https://c3p7kf-3000.csb.app/dataabsen"
                    method = "POST"
                    console.log(bodyData)
                    
                    tableInfo.classList.remove("invisible");
                    tableInfo.classList.add("table-container");
                    removeTableRow("table-info");
                    addNoNamesTableRow("table-info","Tunggu.....");
    
                    const addData = await fetchData(URL, method, bodyData);
    
                    if (addData.data_saved.length > 0) {
                        removeTableRow("table-info");
                        addNoNamesTableRow("table-info","Berhasil dikirim...");
                        btn.textContent = "Update";
                    } else {
                        removeTableRow("table-info");
                        addNoNamesTableRow("table-info","Absen tidak berhasil...");
                    }
    
    
                        break;
    
                case "Update":
                    URL = "https://c3p7kf-3000.csb.app/dataabsen"
                    method = "PATCH"
                    console.log(bodyData)
    
                    tableInfo.classList.remove("invisible");
                    tableInfo.classList.add("table-container");
                    removeTableRow("table-info");
                    addNoNamesTableRow("table-info","Tunggu.....");
    
                    const updateData = await fetchData(URL, method, bodyData);
    
                    if (updateData.data_saved.length > 0) {
                        removeTableRow("table-info");
                        addNoNamesTableRow("table-info","Berhasil diupdate...");
                    } else {
                        removeTableRow("table-info");
                        addNoNamesTableRow("table-info","Update tidak berhasil...");
                    }
                        break;
                default:
                    break;
            }
        } else {
            tableInfo.classList.remove("invisible");
            tableInfo.classList.add("table-container");
            removeTableRow("table-info");
            addNoNamesTableRow("table-info","Gagal! Data absen belum lengkap!");
        }

        
    }
    
    
}

/**----------------------Other Tools------------------ */
var expectText = [1,2,3,4,5,6];
var keyText = ["satu","dua","tiga","empat","lima","enam"];
let json;
let dataArray;
var tingkat = "belum";


async function getDataTingkat() {

    try {
        const URL = "https://c3p7kf-3000.csb.app/tahunajaran/now";
        const params = new URLSearchParams({
            tanggal : document.getElementById("select-date").value
        });

        json = await getData(`${URL}?${params}`);
        dataArray = Object.keys(json.data_kelas);

        var tingkatArray = [];

        var index = 0;
        dataArray.map(function(key) {

            var texts = key.split('_');
            let text;

            for (let i = 0; i < keyText.length; i++) {
                const element = keyText[i];
                if (texts[0] === keyText[i]) {
                    text = expectText[i] + " " + texts[1].toUpperCase();
                }
            }
            tingkatArray.push(text);
        })
        
        tingkatArray.sort(function(a, b) {
            var numberA = parseInt(a.split(" ")[0]);// ambil string awal
            var numberB = parseInt(b.split(" ")[0]);// ambil string awal
            console.log("a : " + numberA + " | b : " + numberB);
            return numberA - numberB; 
        });

        return tingkatArray;
    } catch (error) {
        console.log( "terjadi kesalahan" + error)
    }
};

function getDataWalikelas(tingkatSelected) {
    var texts = tingkatSelected.split(" ");
    const dataWalikelas = json.dataWalikelas;
    var arrayIdWalikelas = [];
    var arrayWalikelasNames = [];
    let selectedTingkat;
    for (let i = 0; i < expectText.length; i++) {
        if (parseInt(texts[0]) == expectText[i]) {
            selectedTingkat = keyText[i] + "_" + texts[1].toLowerCase();
        }
    }
    tingkat = selectedTingkat;
    console.log("Tingkat yang dipilih : " + selectedTingkat);

    const arrayObject = json.data_kelas[selectedTingkat];
    console.log("array object : "+arrayObject)

    arrayObject.forEach(element => {
        arrayIdWalikelas.push(element.walikelas);
    });

    console.log(arrayIdWalikelas)
    console.log(dataWalikelas)
   
    arrayIdWalikelas.forEach(idWalikelas => {
        const walikelasFounded = dataWalikelas.find(item => idWalikelas == item.id);
        arrayWalikelasNames.push("UST. " + walikelasFounded.nama);
    });    
    
    console.log(arrayWalikelasNames);
    return arrayWalikelasNames;
}

function getDataKelasByWalikelasName(walikelas) {
    var tahunajaran = json.tahunAjaranNow;
    var idwalikelas = getDataWaliKelas(walikelas).id;
    var kelas = getDataKelas(idwalikelas).kelas;
    var idkelas = getDataKelas(idwalikelas).id;
    var tanggal = document.getElementById("select-date").value;
    var jam = getDropDownListSelectedById("jam").substring(7);

    console.log({ tahunajaran, tingkat, idkelas, kelas, walikelas : idwalikelas, tanggal, jam : parseInt(jam)});
    return { tahunajaran, tingkat, idkelas, kelas, walikelas : idwalikelas, tanggal, jam : parseInt(jam)};
}

function getDataWaliKelas(walikelas) {
    let walikelasName = walikelas.substring(5);
    return json.dataWalikelas.find(item => walikelasName.toUpperCase() == item.nama.toUpperCase());
};

function getDataKelas(idWalikelas) {
    var dataKelas = json.data_kelas[tingkat].filter(item => idWalikelas == item.walikelas);
    console.log(dataKelas)
    return dataKelas[0];
};

/**------------------reUse Tools-------------------- */

function addDropDownList(id, data) {
    var value = 1;

    data.forEach(element => {
        // buat optipn baru
        var newList = document.createElement("option");
        
        value++;
        newList.value = value;
        newList.text = element;
             
        var selectElement = document.getElementById(id);

        // set option value
        selectElement.appendChild(newList);

    });
}

function removeDropDownList(id) {
    const selectElement = document.getElementById(id)
    while (selectElement.options.length > 1) {
        selectElement.options.remove(1);
    }
}

function targetToArray(target) {

    const array = [];

    if ((Array.isArray(target))) {

        target.forEach(element => {
            array.push(parseInt(element))
        });
        
    } else {
        array.push(parseInt(target))
    }
    return array;
}

function addTableRow(number, id, name, absensi) {
    const tableBody = document.getElementById("table-body");

    // Buat elemen-elemen HTML baru
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="number-collum">${number}.</td>
        <td class="name-collum" id="${id}">${name}</td>
        <td>
            <div class="checkbox-cell checkbox-container" id="radios${id}">
                <label class="checkbox-label">
                    <input type="radio" name="option${id}" value="H" />
                    <span class="checkbox-custom">H</span>
                </label>
                <label class="checkbox-label">
                    <input type="radio" name="option${id}" value="S" />
                    <span class="checkbox-custom">S</span>
                </label>
                <label class="checkbox-label">
                    <input type="radio" name="option${id}" value="I" />
                    <span class="checkbox-custom">I</span>
                </label>
                <label class="checkbox-label">
                    <input type="radio" name="option${id}" value="A" />
                    <span class="checkbox-custom">A</span>
                </label>
            </div>
        </td>
        `;

    
    
    // Tambahkan <tr> ke dalam <tbody> tabel
    tableBody.appendChild(tr);

    if (absensi !== null) {
        console.log(absensi)
        const radioButton = document.querySelector(`input[name="option${id}"][value="${absensi}"]`);
        radioButton.checked = true;
    }
}


function addNoNamesTableRow(id,text) {
    const tableBody = document.getElementById(id);

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="number-collum">${text}</td>
    `;
    // Tambahkan <tr> ke dalam <tbody> tabel
    tableBody.appendChild(tr);
}

function removeTableRow(id) {
    const tableBody = document.getElementById(id);
    tableBody.innerHTML = ''; // Menghapus semua elemen <tr>
}

function changeButtonText(text) {
    const btn = document.getElementById("button");
    btn.innerText = text
}

function getDropDownListSelectedById(id) {
    const dropDown = document.getElementById(id);
    let index = dropDown.selectedIndex;
    const optionSelected = dropDown.options[index].textContent;
    console.log(optionSelected)
    return optionSelected;
}
