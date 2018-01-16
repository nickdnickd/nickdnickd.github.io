---
layout: post
title: "Let There Be Sound"
date: 2018-01-16
---


## Oh, what a mess! 

Think about where you're sitting right now. Millions of
air molecules are swirling around you. Take a breath and realize that your
sampling from the chaotic system around you. You capture many of these molecules
along with the minority precious oxygen that constantly keeps us alive. The
rules of fluids are well defined in pipes and narrow settings (even that
requires a massive textbook to understand). However, we start to lose our grasp
as we try to model the world with more detail. On the large scale, we cannot
tell the weather with absolute certainty even if knew every wind pattern. We
simply don't have the computational resources on earth. Even if we had the
computational power, we will never nail it down on the small scale because we
will have to start making predictions about the position of the electrons. And
thanks to the properties of quantum mechanics we will be unable to know the
exact speed if we know the position! We sort of knew the world was not fully
defined but even in the comfort of simple equations, there lurks a noisy hum of
the real world.

## Just Breath

Despite all of this, it's okay. Our head sensors equipped for electro-optical
vision enable you to read this passage. Our vocal transmitters and receivers
have mastered the propagation of waves through this swirling ocean of air so you
can say "Hey" and somebody will understand you. In fact several of these
disturbances are beautiful to us and some people devote their lives to
cultivating pressure waves that ripple through the air. I'm talking about audio
engineers, musicians, producers and writers. This doesn't stop at the ear;
mechanical engineers study the characteristics of physical vibration through
materials and RF (radiofrequency) engineers study the propagation of waves that
require no medium.

## Penny Fourier Thoughts?

Is there a more accurate way we can talk about this? When we look at a typical
audio recording (can you tell me much about
[this](https://i.stack.imgur.com/x3mF3.jpg) image?) we just see a bunch of fuzz,
same goes for a radio signal. But sometimes, on certain music players, they
display the EQ (equalizer). This contains a binned up view of different
_frequencies_. Say you hear a large bass boom in the track, when that happens
the lower ends of the EQ light up like crazy. In fact if the EQ is adjustable
you can even feel and hear the difference as you turn the knob. If these bins
give us such a clear picture, could we enhance our understanding by creating
smaller and smaller bins on the EQ? What if they were infinitely small? That is
what a French mathematician and aid to Napoleon, [Joseph
Fourier](https://en.wikipedia.org/wiki/Joseph_Fourier), laid down the pillars
for without fully knowing it yet. He postulated that one can completely break
down a (periodic) function into component sine waves, each with their own
frequency. After some revisions from future mathematicians we have the Fourier
Transform to give us the mathematical intuition our ears and to some extent our
eyes had all along.

Still, there is a long way to go from this different interpretation of a signal
to creating something amazing. So let's start with the simplest wave to the ears
and eyes, the sine wave. Below we have a plot of a sine wave and its
corresponding Fourier Transform (FFT means Fast Fourier Transform, it was an
algorithm later developed using the butterfly method to speed up the digital
computation). What you will see and hear in various forms is an "A" note.
```python

import matplotlib.pyplot as plt
import numpy as np
import winsound
    
two_pi = 2 * np.pi
frequency = 440 # "A" note in Hz
duration_ms = 50 # miliseconds
duration_s = duration_ms/1000.0
sample_rate = 44.1 * 1000  #Hz or samples/second

# Beeeeep
winsound.Beep(frequency, duration_ms) # Beep(frequency in hz, duration in ms)

x_samples = range(int(duration_s*sample_rate))
x_time = [(float(x_sample) / float(sample_rate)) for x_sample in x_samples]
y_0 = np.cos([two_pi * frequency * time_el for time_el in x_time])
    
plt.figure(figsize=(20,10))
plt.plot(x_time, y_0)
plt.title('A-note in time and frequency')
plt.xlabel('Time (seconds)')
plt.ylabel('Magnitude')
plt.show()
    
t = np.linspace(0, x_time[-1], len(x_time))
sp = np.fft.fft(y_0)
freq = np.fft.fftfreq(len(x_samples), d=(1/sample_rate))
plt.figure(figsize=(20,10))
plt.plot(freq, abs(sp)) #, freq, sp.imag)
plt.xlabel("Frequency")
plt.ylabel("Magnitude")
plt.xlim(xmax=2*frequency, xmin = -2*frequency)
plt.show()
```

![png](audio_0_files/audio_0_1_0.png)



![png](audio_0_files/audio_0_1_1.png)


Feel free to adjust the frequency, amplitude and duration to kick the tires. As
you can see the spikes in Frequency are _mostly_ found at the generating
frequency. This I attribute to the imperfections of the discrete domain which
could have its own post. Also, you can rest assured about negative frequencies.
If the original signal is real (and the sine wave is real... whew) there should
be a symmetrical graph about 0 Hz (more info
[here](https://en.wikipedia.org/wiki/Negative_frequency)).

At this point it is safe to say that we can design an algorithm to bin the
frequencies up and infer the signal from an input sine wave. Essentially
wherever there is more energy in the frequency plot is where we most likely to find the frequency of our original wave. Our machine can listen to a perfect beep and tell us what note it is. Great. Now, what if we recorded a guitar
plucking an A note? What if a truck is going by in the background of that
recording? How does our methodology hold up when we start approaching the
looming real world? Can we generate audio that sounds like the real world? I
hope to seek the answers to some of these questions in later posts.


    
