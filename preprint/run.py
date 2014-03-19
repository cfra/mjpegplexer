#!/usr/bin/env python

import subprocess
import sys

print 'Das ist preprint!!1elf'
subprocess.call(['logger', 'would print %s' % sys.argv[1]])
