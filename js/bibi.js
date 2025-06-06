let svg = '<svg  viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="is-badge"><path  d="m512 268c0 17.9-4.3 34.5-12.9 49.7s-20.1 27.1-34.6 35.4c.4 2.7.6 6.9.6 12.6 0 27.1-9.1 50.1-27.1 69.1-18.1 19.1-39.9 28.6-65.4 28.6-11.4 0-22.3-2.1-32.6-6.3-8 16.4-19.5 29.6-34.6 39.7-15 10.2-31.5 15.2-49.4 15.2-18.3 0-34.9-4.9-49.7-14.9-14.9-9.9-26.3-23.2-34.3-40-10.3 4.2-21.1 6.3-32.6 6.3-25.5 0-47.4-9.5-65.7-28.6-18.3-19-27.4-42.1-27.4-69.1 0-3 .4-7.2 1.1-12.6-14.5-8.4-26-20.2-34.6-35.4-8.5-15.2-12.8-31.8-12.8-49.7 0-19 4.8-36.5 14.3-52.3s22.3-27.5 38.3-35.1c-4.2-11.4-6.3-22.9-6.3-34.3 0-27 9.1-50.1 27.4-69.1s40.2-28.6 65.7-28.6c11.4 0 22.3 2.1 32.6 6.3 8-16.4 19.5-29.6 34.6-39.7 15-10.1 31.5-15.2 49.4-15.2s34.4 5.1 49.4 15.1c15 10.1 26.6 23.3 34.6 39.7 10.3-4.2 21.1-6.3 32.6-6.3 25.5 0 47.3 9.5 65.4 28.6s27.1 42.1 27.1 69.1c0 12.6-1.9 24-5.7 34.3 16 7.6 28.8 19.3 38.3 35.1 9.5 15.9 14.3 33.4 14.3 52.4zm-266.9 77.1 105.7-158.3c2.7-4.2 3.5-8.8 2.6-13.7-1-4.9-3.5-8.8-7.7-11.4-4.2-2.7-8.8-3.6-13.7-2.9-5 .8-9 3.2-12 7.4l-93.1 140-42.9-42.8c-3.8-3.8-8.2-5.6-13.1-5.4-5 .2-9.3 2-13.1 5.4-3.4 3.4-5.1 7.7-5.1 12.9 0 5.1 1.7 9.4 5.1 12.9l58.9 58.9 2.9 2.3c3.4 2.3 6.9 3.4 10.3 3.4 6.7-.1 11.8-2.9 15.2-8.7z" fill="#1da1f2"></path></svg>'
    , total = 0
    , nowNum = 0
    , items = []
    , page = 1
    , Url = "https://kkapi.fomal.cc/api/ispeak?author=6319fedef46fae97dcfa5ee2&page=";
function getNew() {
    let e = document.getElementById("bibi");
    try {
        e.removeChild(document.getElementById("more"))
    } catch (e) { }
    e.innerHTML += '<div id="bb_loading"><img src="/assets/loading3.gif" alt="bb_loading"></div>',
        fetch(Url + page).then((e => e.json())).then((e => {
            total = e.data.total,
                items = e.data.items,
                nowNum += items.length,
                1 == page && (document.querySelector(".bb-info").innerHTML = '<svg style="width:1.20em;height:1.20em;top:5px;fill:currentColor;overflow:hidden;position:relative"><use xlink:href="#icon-chat"></svg> 站长的唠叨(' + total + ")"),
                page += 1
        }
        )).then((() => {
            bb(),
                nowNum < total && (document.getElementById("bibi").innerHTML += '<button id="more" onclick="getNew()">再翻翻</button>'),
                document.getElementById("bibi").removeChild(document.getElementById("bb_loading"))
        }
        ))
}
function bb() {
    let e = document.getElementById("bb-main");
    items.forEach((t => {
        let a = t.createdAt.substring(0, 10)
            , n = document.createElement("div");
        t.content = contentFormat(t.content),
            n.className = "bb-card",
            n.innerHTML = '<div class="card-header"><div class="avatar"><img class="nofancybox"src="' + t.author.avatar + '"></div><div class="name">' + t.author.nickName + "</div>" + svg + '<div class="card-time">' + a + '</div></div><div class="card-content">' + t.content + '</div><div class="card-footer"><div data-v-185689ea=""class="card-label"style="background: ' + t.tag.bgColor + '; color: white;">' + t.tag.name + "</div></div>",
            e.appendChild(n)
    }
    ))
}
function contentFormat(e) {
    let t = e.match(/(http(.*).[jpg|png|gif])/g);
    e = (e = e.replace(/<img(.*?)src=[\"|\']?(.*?)[\"|\']?(.*?)>|!\[(.*?)\]\((.*?)\)/g, "")).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    let a = "<br>";
    return t && t.forEach((e => {
        a += '<a href="' + e + '" target="_blank" data-fancybox="group" class="fancybox"><img src="' + e + '"></a>'
    }
    )),
        e += a
}
window.addEventListener("DOMContentLoaded", (() => {
    getNew()
}
));
