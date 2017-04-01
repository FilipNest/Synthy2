$(document).ready(function () {

  var pads = [];

  for (i = 0; i < 16; i += 1) {
    pads.push(null)
  }

  var template = Handlebars.compile($("body").html());

  $("body").html(template({
    pads: pads
  }));

  window.map_range = function (value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }

  $.each($(".pad"), function (index, element) {

    pads[index] = $(element)
      .xy({
        displayPrevious: false,
        min: -256,
        max: 256,
        fgColor: "white",
        width: "90",
        height: "90",
        change: function (value) {

          var pitch = valueToNote(value[1]);

          var octave = $($("#pad" + index).find(".octave input:checked")[0]).val();

          synths[index].setNote(pitch + octave);

          value = map_range(value[1], -256, 256, 0, 100);

          function HSVtoRGB(h, s, v) {
            var r, g, b, i, f, p, q, t;
            if (arguments.length === 1) {
              s = h.s, v = h.v, h = h.h;
            }
            i = Math.floor(h * 6);
            f = h * 6 - i;
            p = v * (1 - s);
            q = v * (1 - f * s);
            t = v * (1 - (1 - f) * s);
            switch (i % 6) {
              case 0:
                r = v, g = t, b = p;
                break;
              case 1:
                r = q, g = v, b = p;
                break;
              case 2:
                r = p, g = v, b = t;
                break;
              case 3:
                r = p, g = q, b = v;
                break;
              case 4:
                r = t, g = p, b = v;
                break;
              case 5:
                r = v, g = p, b = q;
                break;
            }
            return {
              r: Math.round(r * 255),
              g: Math.round(g * 255),
              b: Math.round(b * 255)
            };
          }

          function rainbow(p) {
            var rgb = HSVtoRGB(p / 100.0 * 0.85, 1.0, 1.0);
            return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
          }

          var colour = rainbow(value);

          pads[index].css("background", colour)

          return value;

        }

      })
      .css({
        "background": 'black',
        'border': '2px solid black',
        'display': "inline-block"
      });

    // Default state of pads in order

    if (index === 0) {

      $("select[name=pad" + index + "] option").eq(0).attr("selected", "selected");

    } else {

      $("select[name=pad" + index + "] option").eq(index).attr("selected", "selected");

    }

  })

  window.bpm = 1000;

  Tone.Transport.bpm.value = 120;

  window.timeouts = [];

  var synths = [];
  var distortions = [];

  for (var i = 0; i < 16; i++) {

    distortions.push(new Tone.Distortion(0));

    synths.push(new Tone.Synth({
      volume: 1,
      envelope: {
        attack: 0.001,
        decay: 0.001,
        sustain: 1,
        release: 0.001
      }
    }).chain(Tone.Master));
  }

  window.valueToNote = function (value) {

    var index = Math.round(map_range(value, -256, 256, 0, 6));

    var note = ["C", "D", "E", "F", "G", "A", "B"];

    return note[index];

  }

  window.triggerPad = function (trigger) {

    var triggers = [];

    $.each($(".pad-block select.trigger option:selected"), function (index, element) {

      if ($(element).val() == trigger) {

        var pad = $(element).parents(".pad-block")[0];

        $(pad).addClass("active");

        var length = parseInt($($(pad).find("select.length option:selected")[0]).val());

        var octave = $($(pad).find(".octave input:checked")[0]).val();

        var index = parseInt($(pad).attr("id").replace("pad", ""));

        var pitch = pads[index].find(".pad input[name=y]").val();
        var distortion = pads[index].find(".pad input[name=x]").val();

        var distortionValue = Math.round(map_range(distortion, -256, 256, 0, 100));

        distortions[index].wet.value = distortionValue;

        var pitchvalue = valueToNote(pitch)

        var note = pitchvalue + octave;
        synths[index].triggerAttackRelease(pitchvalue + octave, length + "n");

        triggers.push({
          pad: index + 1,
          length: bpm / length,
          current: pad
        })

      }

    })

    triggers.forEach(function (trigger) {

      var timeout = window.setTimeout(function () {

        $(trigger.current).removeClass("active");

        triggerPad(trigger.pad);

        timeouts.forEach(function (element, index) {

          if (element === timeout) {

            timeouts.splice(index, 1);

          }

        })

        if (!timeouts.length) {

          triggerPad("go");

        }

      }, trigger.length);

      timeouts.push(timeout);

    })

  }

  var clear = function () {

    window.timeouts.forEach(function (element) {

      window.clearTimeout(element);

    })

    $(".pad-block").removeClass("active");

    window.timeouts = [];

  }

  $("#play").click(function () {

    clear();

    triggerPad("go");

  })


  $("#stop").click(function () {

    clear();

  })

})
